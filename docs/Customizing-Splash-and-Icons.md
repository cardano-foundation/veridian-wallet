## Splashscreen and Icons  

To customize the app icons and splash screens, the Veridian Wallet uses the [@capacitor/assets](https://github.com/ionic-team/capacitor-assets) package.    

### Steps to Customize  

1. **Replace Default Assets**  
   Replace the default icons and splash screens in the `./src/assets` folder with your custom assets.  

2. **Generate Required Resources**  
   Run the following command to generate platform-specific resources for all platforms:  

   ```bash  
   npx capacitor-assets generate --assetPath ./src/assets  

This will generate the icons and splash screens for all platforms.  

For more details, refer to the [Splash Screens and Icons Capacitor Documentation](https://capacitorjs.com/docs/guides/splash-screens-and-icons).

As the last step, we should also replace the favicon (which the user will never see, but the devs will for sure when they work on the app and preview it on the browser). This is a manual process and the file is:

```./public/favicon.ico```
