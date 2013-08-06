using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.SharePoint.Client;
using System.Net;
using SharePointOnline.Helper;

namespace BlingPointDeployment
{
    class Program
    {
        static void Main(string[] args)
        {

            String solutionFile = args[0];
            String siteCollectionUrl = args[1];
            String login = args[2];
            String password = args[3];

            //Authenticate for client object model
            ClientContext clientContext = Authenticator.GetClientContext(siteCollectionUrl, login, password);
            Web site = clientContext.Web;
            clientContext.Load(site);
            clientContext.ExecuteQuery();
            Console.WriteLine("Title: {0}", site.Title);

            //Authenticate for web usage
            CookieContainer cookies = Authenticator.GetAuthenticatedCookies(siteCollectionUrl, login, password);

            //Test solution deactivation, upload, and activation
            try
            {
                Console.WriteLine("Deactivating solution");
                SandboxSolutions.DeactivateSolution(siteCollectionUrl, cookies, solutionFile);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
              
            try
            {
                Console.WriteLine("Uploading solution");
                SandboxSolutions.UploadSolution(siteCollectionUrl, cookies, solutionFile);
            }

            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
            
            try
            {
                Console.WriteLine("Activating solution");
                SandboxSolutions.ActivateSolution(siteCollectionUrl, cookies, solutionFile);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }
    }
}
