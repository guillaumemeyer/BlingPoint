using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text.RegularExpressions;
using Microsoft.SharePoint.Client;

namespace SharePointOnline.Helper
{
    public class Authenticator
    {

        #region Constants

        private const String ACCEPT = "image/jpeg, image/gif, image/pjpeg, application/x-ms-application, application/xaml+xml, application/x-ms-xbap, application/vnd.ms-excel, application/vnd.ms-powerpoint, application/msword, */*";
        private const String HEADER_NOCACHE = "Cache-Control";
        private const String NO_CACHE = "no-cache";

        private const String CONTENT_TYPE_FORM_URLENCODED = "application/x-www-form-urlencoded";

        private const String USER_AGENT = "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)";

        private const String METHOD_POST = "POST";
        private const String METHOD_OPTIONS = "OPTIONS";

        private const String CLAIM_HEADER_RETURN_URL = "X-Forms_Based_Auth_Return_Url";
        private const String CLAIM_HEADER_AUTH_REQUIRED = "X-FORMS_BASED_AUTH_REQUIRED";

        private static readonly Regex REG_UPOST = new Regex(@"<form\s.*?action=\""(.*?)\"".*?>", RegexOptions.IgnoreCase);
        private static readonly Regex REG_PPFT = new Regex(@"<input\s.*?name=\""PPFT\"".*?value=\""(.*?)\"".*?>", RegexOptions.IgnoreCase);
        private static readonly Regex REG_FORM = new Regex(@"<form\s.*?action=\""(.*?)\"".*?>", RegexOptions.IgnoreCase);
        private static readonly Regex REG_SAML_TOKEN = new Regex(@"<input\s.*?name=\""t\"".*?value=\""(.*?)\"".*?>", RegexOptions.IgnoreCase);

        #endregion

        #region Authentication

        /// <summary>
        /// Gets the authenticated cookies.
        /// </summary>
        /// <param name="siteUrl">The site URL.</param>
        /// <param name="login">The login.</param>
        /// <param name="password">The password.</param>
        /// <returns></returns>
        public static CookieContainer GetAuthenticatedCookies(String siteUrl, String login, String password)
        {
            //Gets available cookies
            CookieContainer cookieContainer = CookiesHelper.ReadCookiesFromDisk();

            var webRequest = (HttpWebRequest)WebRequest.Create(siteUrl);
            webRequest.CookieContainer = cookieContainer;
            webRequest.Method = METHOD_OPTIONS;

            String loginPageUrl;
            String navigationEndUrl;

            try
            {
                using (var response = webRequest.GetResponse() as HttpWebResponse)
                {
                    //comes here if windows integrated authentication succeeds
                    response.Close();
                    return cookieContainer;
                }
            }
            catch (WebException webEx)
            {
                //Comes here if cookies aren't valid
                navigationEndUrl = webEx.Response.Headers[CLAIM_HEADER_RETURN_URL];
                loginPageUrl = (webEx.Response.Headers[CLAIM_HEADER_AUTH_REQUIRED]);
            }

            //Login page
            var reqLoginPage = WebRequest.Create(loginPageUrl) as HttpWebRequest;
            reqLoginPage.CookieContainer = cookieContainer;
            reqLoginPage.UserAgent = USER_AGENT;
            reqLoginPage.Accept = ACCEPT;

            String strLoginPageContent = null;
            using (var response = reqLoginPage.GetResponse())
            {
                using (var sr = new StreamReader(response.GetResponseStream()))
                {
                    strLoginPageContent = sr.ReadToEnd();
                    sr.Close();
                }
                response.Close();
            }

            //Lookup post url
            Match matchPost = REG_UPOST.Match(strLoginPageContent);
            String strLoginPostUrl = matchPost.Groups[1].Value;

            Match mPPFT = REG_PPFT.Match(strLoginPageContent);
            String strPPFT = mPPFT.Groups[1].Value;

            var dicPostData = new Dictionary<String, String>();
            dicPostData["login"] = login;
            dicPostData["passwd"] = password;
            dicPostData["type"] = "11";
            dicPostData["LoginOptions"] = "3";
            dicPostData["MEST"] = "";
            dicPostData["PPSX"] = "Passpor";
            dicPostData["PPFT"] = strPPFT;
            dicPostData["idsbho"] = "1";
            dicPostData["PwdPad"] = "";
            dicPostData["sso"] = "";

            String strData = null;
            foreach (String inputKey in dicPostData.Keys)
                strData += (String.IsNullOrEmpty(strData) ? "" : "&") + inputKey + "=" + Uri.EscapeDataString(dicPostData[inputKey]);

            //Post credentials
            var reqLoginPost = WebRequest.Create(strLoginPostUrl) as HttpWebRequest;
            reqLoginPost.CookieContainer = cookieContainer;
            reqLoginPost.Method = METHOD_POST;
            reqLoginPost.Referer = navigationEndUrl;
            reqLoginPost.UserAgent = USER_AGENT;
            reqLoginPost.ContentType = CONTENT_TYPE_FORM_URLENCODED;
            reqLoginPost.ContentLength = strData.Length;
            reqLoginPost.Headers[HEADER_NOCACHE] = NO_CACHE;

            using (var postdata = reqLoginPost.GetRequestStream())
            {
                using (var sw = new StreamWriter(postdata))
                {
                    sw.Write(strData);
                    sw.Close();
                }
            }

            String strLoginPostContent = null;
            using (var response = reqLoginPost.GetResponse() as HttpWebResponse)
            {
                using (var sr = new StreamReader(response.GetResponseStream()))
                {
                    strLoginPostContent = sr.ReadToEnd();
                    sr.Close();
                }
            }

            //Retrieves target for sharepoint web app return url
            Match mForm = REG_FORM.Match(strLoginPostContent);
            String action = mForm.Groups[1].Value;

            //Retrieves the encoded SAML token
            Match mInput = REG_SAML_TOKEN.Match(strLoginPostContent);
            String t = mInput.Groups[1].Value;

            //AUTHENTIFICATION SUR LA WEBAPP SP
            String splData = "t=" + t; //jeton SAML

            //Post the SAML token to the sharepoint login page
            var reqSharePointLogin = WebRequest.Create(action) as HttpWebRequest;
            reqSharePointLogin.CookieContainer = cookieContainer;
            reqSharePointLogin.Method = METHOD_POST;
            reqSharePointLogin.Referer = loginPageUrl;
            reqSharePointLogin.UserAgent = USER_AGENT;
            reqSharePointLogin.ContentType = CONTENT_TYPE_FORM_URLENCODED;
            reqSharePointLogin.ContentLength = splData.Length;
            reqSharePointLogin.Headers[HEADER_NOCACHE] = NO_CACHE;

            using (var stream = reqSharePointLogin.GetRequestStream())
            {
                using (var sw = new StreamWriter(stream))
                {
                    sw.Write(splData);
                    sw.Close();
                }
            }

            using (var response = reqSharePointLogin.GetResponse() as HttpWebResponse)
            {
                CookiesHelper.WriteCookiesToDisk(cookieContainer);
                response.Close();
            }

            return cookieContainer;

        }

        #endregion

        #region Client Context

        /// <summary>
        /// Gets the client context.
        /// </summary>
        /// <param name="siteCollectionUrl">The site collection URL.</param>
        /// <param name="cookies">The cookies.</param>
        /// <returns></returns>
        public static ClientContext GetClientContext(String siteCollectionUrl, CookieContainer cookies)
        {
            if (cookies == null) return null;
            
            var context = new ClientContext(siteCollectionUrl);
            try
            {
                context.ExecutingWebRequest += delegate(object sender, WebRequestEventArgs e)
                {
                    e.WebRequestExecutor.WebRequest.CookieContainer = cookies;
                };
            }
            catch
            {
                if (context != null) context.Dispose();
                throw;
            }

            return context;
        }

        /// <summary>
        /// Gets the client context.
        /// </summary>
        /// <param name="siteCollectionUrl">The site collection URL.</param>
        /// <param name="login">The login.</param>
        /// <param name="password">The password.</param>
        /// <returns></returns>
        public static ClientContext GetClientContext(String siteCollectionUrl, String login, String password)
        {
            var cookies = GetAuthenticatedCookies(siteCollectionUrl, login, password);

            return GetClientContext(siteCollectionUrl, cookies);
        }

        #endregion

    }
}
