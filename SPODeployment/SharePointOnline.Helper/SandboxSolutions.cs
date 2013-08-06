using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.SharePoint.Client;

namespace SharePointOnline.Helper
{
    public class SandboxSolutions
    {

        #region Constants

        private static readonly Regex REG_INPUT = new Regex(@"<input.+?\/?>", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex REG_ATTR_NAME = new Regex(@"name=\""(.+?)\""", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex REG_ATTR_VALUE = new Regex(@"value=\""(.+?)\""", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex REG_BUTTON_ACTIVATESOLUTION = new Regex(@"_v_rg_spbutton\[\'Ribbon.ListForm.Display.Solution.ActivateSolution\'\]\s=\s'(.*?)';", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex REG_BUTTON_DEACTIVATESOLUTION = new Regex(@"_v_rg_spbutton\[\'Ribbon.ListForm.Display.Solution.DeactivateSolution\'\]\s=\s'(.*?)';", RegexOptions.IgnoreCase | RegexOptions.Compiled);

        #endregion

        #region Public Methods

        /// <summary>
        /// Activates the solution.
        /// </summary>
        /// <param name="siteCollectionUrl">The site collection URL.</param>
        /// <param name="cookies">The cookies.</param>
        /// <param name="solutionName">Name of the solution.</param>
        public static void ActivateSolution(String siteCollectionUrl, CookieContainer cookies, String solutionName)
        {
            ActivateSolution(siteCollectionUrl, cookies, solutionName, true);
        }

        /// <summary>
        /// Deactivates the solution.
        /// </summary>
        /// <param name="siteCollectionUrl">The site collection URL.</param>
        /// <param name="cookies">The cookies.</param>
        /// <param name="solutionName">Name of the solution.</param>
        public static void DeactivateSolution(String siteCollectionUrl, CookieContainer cookies, String solutionName)
        {
            ActivateSolution(siteCollectionUrl, cookies, solutionName, false);
        }

        /// <summary>
        /// Uploads the solution.
        /// </summary>
        /// <param name="siteCollectionUrl">The site collection URL.</param>
        /// <param name="cookies">The cookies.</param>
        /// <param name="filePath">The file path.</param>
        public static void UploadSolution(String siteCollectionUrl, CookieContainer cookies, String filePath)
        {
            siteCollectionUrl = siteCollectionUrl.TrimEnd('/');
            var file = new FileInfo(filePath);
            var ctx = Authenticator.GetClientContext(siteCollectionUrl, cookies);

            var newFile = new FileCreationInformation();
            newFile.Content = System.IO.File.ReadAllBytes(file.FullName);
            newFile.Url = file.Name;
            newFile.Overwrite = true;

            var fileUrl = String.Format("{0}/_catalogs/solutions", siteCollectionUrl);
            var fileUri = new Uri(fileUrl);

            var solutions = ctx.Web.GetFolderByServerRelativeUrl(fileUri.AbsolutePath);
            Microsoft.SharePoint.Client.File uploadFile = solutions.Files.Add(newFile);
            ctx.Load(uploadFile);
            ctx.ExecuteQuery();
        }

        #endregion

        #region Private Utilities

        /// <summary>
        /// Gets the solution id.
        /// </summary>
        /// <param name="siteCollectionUrl">The site collection URL.</param>
        /// <param name="cookies">The cookies.</param>
        /// <param name="solutionName">Name of the solution.</param>
        /// <returns></returns>
        private static Int32 GetSolutionId(String siteCollectionUrl, CookieContainer cookies, String solutionName)
        {
            siteCollectionUrl = siteCollectionUrl.TrimEnd('/');
            var fileUrl = String.Format("{0}/_catalogs/solutions/{1}", siteCollectionUrl, solutionName);
            var fileUri = new Uri(fileUrl);

            var ctx = Authenticator.GetClientContext(siteCollectionUrl, cookies);

            var solution = ctx.Web.GetFileByServerRelativeUrl(fileUri.AbsolutePath);
            ctx.Load(solution.ListItemAllFields, item => item.Id);
            ctx.ExecuteQuery();

            return solution.ListItemAllFields.Id;
        }

        /// <summary>
        /// Activates or deactivates the solution.
        /// </summary>
        /// <param name="siteCollectionUrl">The site collection URL.</param>
        /// <param name="cookies">The cookies.</param>
        /// <param name="solutionName">Name of the solution.</param>
        /// <param name="activate">if set to <c>true</c> [activate].</param>
        private static void ActivateSolution(String siteCollectionUrl, CookieContainer cookies, String solutionName, Boolean activate)
        {
            siteCollectionUrl = siteCollectionUrl.TrimEnd('/');
            var solutionId = GetSolutionId(siteCollectionUrl, cookies, solutionName);

            //Queries the solution's page
            String operation = activate ? "ACT" : "DEA";
            var solutionPageUrl = String.Format("{0}/_catalogs/solutions/forms/activate.aspx?Op={1}&ID={2}", siteCollectionUrl, operation, solutionId);
            var req = WebRequest.Create(solutionPageUrl) as HttpWebRequest;
            req.CookieContainer = cookies;
            req.Accept = "text/html, application/xhtml+xml, */*";
            req.Headers["Accept-Language"] = "fr-FR,en-US";
            req.UserAgent = "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)";
            req.Headers["Accept-Encoding"] = "gzip, deflate";

            var inputs = new Dictionary<String, String>();

            using (WebResponse response = req.GetResponse())
            {
                //decode response
                String strResponse = null;
                var stream = response.GetResponseStream();
                if (!String.IsNullOrEmpty(response.Headers["Content-Encoding"]))
                    if (response.Headers["Content-Encoding"].ToLower().Contains("gzip"))
                        stream = new GZipStream(stream, CompressionMode.Decompress);
                    else if (response.Headers["Content-Encoding"].ToLower().Contains("deflate"))
                        stream = new DeflateStream(stream, CompressionMode.Decompress);

                //get response string
                using (var sr = new StreamReader(stream))
                {
                    strResponse = sr.ReadToEnd();
                    sr.Close();
                }
                stream.Close();

                //Look for inputs and add them to the dictionary for postback values
                foreach (Match match in REG_INPUT.Matches(strResponse))
                {
                    var matchName = REG_ATTR_NAME.Match(match.Groups[0].Value);
                    String name = matchName.Groups[1].Value;

                    var matchValue = REG_ATTR_VALUE.Match(match.Groups[0].Value);
                    String value = matchValue.Groups[1].Value;

                    inputs[name] = value;
                }

                //Lookup for activate button's id
                var searchString = activate ? "ActivateSolutionItem" : "DeactivateSolutionItem";
                var regButtonLinkTag = new Regex(String.Format(@"__doPostBack\(\&\#39\;(.*?{0})\&\#39\;", searchString), RegexOptions.IgnoreCase);
                var matchButtonLink = regButtonLinkTag.Match(strResponse);

                inputs["__EVENTTARGET"] = matchButtonLink.Groups[1].Value;

                response.Close();
            }

            //Format inputs as postback data string, but ignore the one that ends with iidIOGoBack
            String strPost = null;
            foreach (String inputKey in inputs.Keys)
                if (!String.IsNullOrEmpty(inputKey) && !inputKey.EndsWith("iidIOGoBack"))
                    strPost += (String.IsNullOrEmpty(strPost) ? "" : "&") + Uri.EscapeDataString(inputKey) + "=" + Uri.EscapeDataString(inputs[inputKey]);
            byte[] postData = Encoding.UTF8.GetBytes(strPost);

            //Build postback request
            var activateRequest = WebRequest.Create(solutionPageUrl) as HttpWebRequest;
            activateRequest.Method = "POST";
            activateRequest.Accept = "text/html, application/xhtml+xml, */*";
            activateRequest.CookieContainer = cookies;
            activateRequest.ContentType = "application/x-www-form-urlencoded";
            activateRequest.ContentLength = postData.Length;
            activateRequest.UserAgent = "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)";
            activateRequest.Headers["Cache-Control"] = "no-cache";
            activateRequest.Headers["Accept-Encoding"] = "gzip, deflate";
            activateRequest.Headers["Accept-Language"] = "fr-FR,en-US";

            //Add postback data to the request stream
            using (Stream stream = activateRequest.GetRequestStream())
            {
                stream.Write(postData, 0, postData.Length);
                stream.Close();
            }

            //Perform the postback
            using (WebResponse response = activateRequest.GetResponse())
            {
                response.Close();
            }
        }

        #endregion

    }
}
