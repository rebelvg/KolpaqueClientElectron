export const globalStyle = `
    @font-face {
        font-family: 'Helvetica';
        src: url('./static/fonts/HelveticaRegular.woff') format('woff');
        font-weight: normal;
  
        font-style: normal;
    }
    @font-face {
        font-family: 'Helvetica';
        src:url('./static/fonts/HelveticaBold.woff') format('woff');
        font-weight: bold;
        font-style: normal;
    }
   
    body {
        overflow: hidden;
        height: 100%;
        width: 100%;
        position: absolute;
        font-family: "Helvetica";
    }
    
    #app {
        height: 100%;
    }
    
    .Select-control {
        border-radius: 0 !important;
    }
`