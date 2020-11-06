const fsExtra = require('fs-extra');
const https = require('https');

// const k = '6083FC2E5FF4E12C32107A965731CC4C';
const createState = (state) => {
    return new Proxy(state, {
            set(target, property, value) {
            target[property] = value;
            render();
            return true;
        }
    });
};

const state = createState({
    steamapplocation: '',
    moddata: ''
});

const listeners = document.querySelectorAll('[data-model]');
const generateButton = document.getElementById('generate');
const steamAppInput = document.getElementById('steamappinput');
const clearButton = document.getElementById('clear');
const infoButton = document.getElementById('info');
const closeButton = document.getElementById('close');

listeners.forEach((listener) => {
    const steamapplocation = listener.dataset.model;

    listener.addEventListener('keyup', (event) => {
        state[steamapplocation] = listener.value;
    });
});

steamAppInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        generate();
    }
});

generateButton.addEventListener('click', (event) => {
    generate();
});

clearButton.addEventListener('click', (event) => {
    clear();
});

infoButton.addEventListener('click', (event) => {
    openInfo();
});

closeButton.addEventListener('click', (event) => {
    document.getElementsByClassName('info')[0].classList.add('hide');
});

const render = () => {
    const bindings = Array.from(document.querySelectorAll('[data-binding]')).map(
        e => e.dataset.binding
    );

    bindings.forEach((binding) => {
        document.querySelector(`[data-model='${binding}']`).innerHTML = state[binding];
        document.querySelector(`[data-model='${binding}']`).value = state[binding];
    });
};

function openInfo() {
    const classList = document.getElementsByClassName('info')[0].classList;

    if (classList.contains('hide')) {
        classList.remove('hide');
    } else {
        classList.add('hide');
    }
}

function clear() {
    document.getElementById('output').innerHTML = '';
    document.getElementsByClassName('output')[0].classList.remove('data-loaded');
}

async function generate() {
    // trim in case white space was copied
    const path = state.steamapplocation.trim() || document.getElementById('steamappinput').value.trim();

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

        const modData = await getModData(path, workshopFiles);

        // Sort alphabetically
        const sortedData = modData.sort((a, b) => {
            if(a.game < b.game) { return -1; }
            if(a.game > b.game) { return 1; }
            return 0;
        })

        buildResultsTable(sortedData);
    } else {
        alert('Path is invalid! Please enter a valid path.');
    }
}

function buildResultsTable(modData) {
    let html = modData.length > 0 ? [] : 'NO DATA WAS FOUND';

    modData.forEach((d) => {
        let temp = `
            <tr>
                <td>${d.game}</td>
                <td>${d.workShopItemIds.join(',')}</td>
                <td>${d.numberOfSubscribedItems}</td>
            </tr>
        `;

        html.push(temp);
    });

    document.getElementsByClassName('output')[0].classList.add('data-loaded');
    document.getElementById('output').innerHTML = Array.isArray(html) ? html.join('') : html;
}

function getModData(path, workshopFiles) {
    return new Promise( (resolve, reject) => {
        const modData = [];

        workshopFiles.forEach((f, i) => {
            const filePath = `${path}\\workshop\\${f}`;
            
            fsExtra.readFile(filePath, "utf8", async (err, data) => {
                if (err) {
                    alert(err);
                }
                
                const steamAppId = getSteamAppId(data);
                const apiUrl = `https://store.steampowered.com/api/appdetails?appids=${steamAppId}`;
                const result = await getData(apiUrl);

                if (result[Object.keys(result)[0]].data) {
                    const workShopItemIds = getWorkShopItemIds(data);
                    modData.push({game: result[Object.keys(result)[0]]?.data?.name, workShopItemIds: workShopItemIds, numberOfSubscribedItems: workShopItemIds.length})
                }
                
                if (workshopFiles.length === (i + 1)) {
                    setTimeout(() => resolve(modData));
                }
            });
        });
    });
}

function getWorkShopItemIds(data) {
    // Split .acf file find workshop ids
    const wsMeta = data.split("WorkshopItemsInstalled")[1].split("WorkshopItemDetails")[0].split('').map((s) => s.trim()).filter((s) => s.length !== 0);
    const parts = wsMeta.join('').split("{");
    const ids = [];
    const finalIds = [];

    parts.forEach((s) => {
        if (s.length > 1) {
            const parts2 = s.split("}");
            ids.push(parts2[parts2.length - 1]);
        }
    })

    // Remove empty strings, remove quotes
    ids.forEach((id) => {
        const _id = id.split('"').filter((s) => s.length > 1)[0];

        if (_id && _id.length > 1) {
            finalIds.push(_id);
        }
    })

    return finalIds;
}

function getSteamAppId(data) {
    const trimed = data.split('"').map((s) => s.trim());

    // Remove empty quotes
    const trimed2 = trimed.filter((s) => s.length !== 0);
    const appId = trimed2[trimed2.findIndex((s, i) => s === 'appid') + 1];

    return appId;
}

function getData(url) {
    return new Promise( (resolve, reject) => {
        fetch(url).then(r => resolve(r.json()))
    });
}

render();

