using System;
using System.IO;
using System.IO.IsolatedStorage;
using System.Runtime.Serialization.Formatters.Binary;
using System.Net;

namespace SharePointOnline.Helper
{
    internal class CookiesHelper
    {

        #region Fields

        private const String COOKIES_FILENAME = "MsoCookies.dat";

        #endregion

        #region Utilities

        /// <summary>
        /// Stores cookies to IsolatedStorage so they can be reused for next runs
        /// </summary>
        /// <param name="cookieJar">The cookie jar.</param>
        internal static void WriteCookiesToDisk(CookieContainer cookieJar)
        {
            try
            {
                IsolatedStorageFile isoStore = IsolatedStorageFile.GetStore(IsolatedStorageScope.User | IsolatedStorageScope.Assembly | IsolatedStorageScope.Domain, null, null);

                using (IsolatedStorageFileStream stream = new IsolatedStorageFileStream(COOKIES_FILENAME, FileMode.Create, isoStore))
                {
                    BinaryFormatter formatter = new BinaryFormatter();
                    formatter.Serialize(stream, cookieJar);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Problem writing cookies to disk: " + ex.Message);
            }
        }

        /// <summary>
        /// Returns the cookie contained saved in IsolatedStorage
        /// </summary>
        /// <returns></returns>
        internal static CookieContainer ReadCookiesFromDisk()
        {
#if DEBUG
            return new CookieContainer();
#endif
            try
            {
                IsolatedStorageFile isoStore = IsolatedStorageFile.GetStore(IsolatedStorageScope.User | IsolatedStorageScope.Assembly | IsolatedStorageScope.Domain, null, null);

                using (IsolatedStorageFileStream stream = new IsolatedStorageFileStream(COOKIES_FILENAME, FileMode.Open, isoStore))
                {
                    BinaryFormatter formatter = new BinaryFormatter();
                    return formatter.Deserialize(stream) as CookieContainer;
                }
            }
            catch (FileNotFoundException)
            {
                return new CookieContainer();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error loading cookies from disk: " + ex.Message);
                return new CookieContainer();
            }
        }

        #endregion

    }
}
