const fsExtra = require('fs-extra');
const Axios = require('axios');
const VueAxios = require('vue-axios');

const app = Vue.createApp({})

app.use(VueAxios, Axios)

app.component('form-component', {
  data() {
    return {
      highlight: false,
      steamAppsPath: "E:\\Steam\\steamapps", // "path/to/your/steamapps",
      gameNames: []
    }
  },
  renderTracked({ key, target, type }) {
    console.log({ key, target, type })
    /* This will be logged when component is rendered for the first time:
    {
      key: "cart",
      target: {
        cart: 0
      },
      type: "get"
    }
    */
  },
  updated() {
    this.$nextTick(function () {
      // Code that will run only after the
      // entire view has been re-rendered
    })
  },
  methods: {
    generate: (path) => {
      debugger
      if (path === "path/to/your/steamapps") {
        alert('Path is invalid! Please enter a valid path.');
        return;
      }

      if (path.split('\\').length > 1 
        && path.split('\\').includes('steamapps')
        && path.split('\\')[path.split('\\').length -1] === 'steamapps'
      ) {
        const p = `${path}\\workshop`;
        const workshopFiles = [];

        fsExtra.readdirSync(p).forEach(file => {
          if (file.split('.').includes('acf')) {
            workshopFiles.push(file);
          }
        });

        if (workshopFiles.length === 0) {
          alert('Cannot find any workshop files');
          return;
        }

        workshopFiles.forEach((f) => {
          const filePath = `${path}\\workshop\\${f}`;
          fsExtra.readFile(filePath, "utf8", (err, data) => {
            if (err) {
              alert(err);
            }
            
            const steamAppId = getSteamAppId(data);
            const apiUrl = `http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=6083FC2E5FF4E12C32107A965731CC4C&appid=${steamAppId}`;
            

            // const d = app.$http.get(apiUrl);

            Axios.get(apiUrl).then((response) => {
              if (response.data.game && response.data.game.gameName) {
                app.component('form-component').data().gameNames.push(response.data.game.gameName);
                // Vue.nextTick(() => {
                //   app.component('form-component').data().gameNames.push(response.data.game.gameName);
                //   app.component('form-component').reRender();
                // })
              }
            });
          });
        });
      } else {
        alert('Path is invalid! Please enter a valid path.');
      }

      function getSteamAppId(data) {
        const trimed = data.split('"').map((s) => s.trim());
        
        // Remove empty quotes
        const trimed2 = trimed.filter((s) => s.length !== 0);
        const appId = trimed2[trimed2.findIndex((s, i) => s === 'appid') + 1];

        return appId;
      }
    }
  },
  template: `
    <div class="flex-header">
      <label class="label">Steam apps location:</label>
      <a href="javascript:void(0)" title="Copy your steam apps path and paste it into the steam apps location input.">
        <img @mouseenter='highlight = !highlight' @mouseleave='highlight = !highlight' class="info-icon" src="./images/info.png" alt="" />
      </a>
    </div>
    
    <div class="input-btn-wrapper">
      <input v-model="steamAppsPath" :class="{highlight: highlight}" type="text" />
      <button @click="generate(steamAppsPath)">GENERATE</button>
    </div>
    
    <label class="label">Output:</label>
    <table id="output" class="output">
      <tr :key="renderKey" v-for="gameName in gameNames">
        <td>{{gameName}}</td>
      </tr>
    </table>
  `  
})

app.mount('#app');
