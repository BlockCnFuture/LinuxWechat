const { app, BrowserWindow, session, ipcMain, shell, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

const link = 'https://wx.qq.com/?&lang&target=t';
let unreadType = 'none';
let platform = require('os').platform();
let tray = null;
let Bro = null;

function RequestHook() {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['Extspam'] = 'Go8FCIkFEokFCggwMDAwMDAwMRAGGvAESySibk50w5Wb3uTl2c2h64jVVrV7gNs06GFlWplHQbY/5FfiO++1yH4ykCyNPWKXmco+wfQzK5R98D3so7rJ5LmGFvBLjGceleySrc3SOf2Pc1gVehzJgODeS0lDL3/I/0S2SSE98YgKleq6Uqx6ndTy9yaL9qFxJL7eiA/R3SEfTaW1SBoSITIu+EEkXff+Pv8NHOk7N57rcGk1w0ZzRrQDkXTOXFN2iHYIzAAZPIOY45Lsh+A4slpgnDiaOvRtlQYCt97nmPLuTipOJ8Qc5pM7ZsOsAPPrCQL7nK0I7aPrFDF0q4ziUUKettzW8MrAaiVfmbD1/VkmLNVqqZVvBCtRblXb5FHmtS8FxnqCzYP4WFvz3T0TcrOqwLX1M/DQvcHaGGw0B0y4bZMs7lVScGBFxMj3vbFi2SRKbKhaitxHfYHAOAa0X7/MSS0RNAjdwoyGHeOepXOKY+h3iHeqCvgOH6LOifdHf/1aaZNwSkGotYnYScW8Yx63LnSwba7+hESrtPa/huRmB9KWvMCKbDThL/nne14hnL277EDCSocPu3rOSYjuB9gKSOdVmWsj9Dxb/iZIe+S6AiG29Esm+/eUacSba0k8wn5HhHg9d4tIcixrxveflc8vi2/wNQGVFNsGO6tB5WF0xf/plngOvQ1/ivGV/C1Qpdhzznh0ExAVJ6dwzNg7qIEBaw+BzTJTUuRcPk92Sn6QDn2Pu3mpONaEumacjW4w6ipPnPw+g2TfywJjeEcpSZaP4Q3YV5HG8D6UjWA4GSkBKculWpdCMadx0usMomsSS/74QgpYqcPkmamB4nVv1JxczYITIqItIKjD35IGKAUwAA==';
        details.requestHeaders['Client-Version'] = '2.0.0';
        callback({ requestHeaders: details.requestHeaders });
    });

    session.defaultSession.webRequest.onBeforeRequest({
        urls: ['https://wx.qq.com/?&lang*', 'https://wx2.qq.com/?&lang*']
    }, (details, callback) => {
        callback((details.url.indexOf('&target=t') > -1) ? {} : { redirectURL: link });
    });

    session.defaultSession.webRequest.onCompleted({
        urls: [
            'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit*',
            'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxinit*',
            'https://wx.qq.com/?&lang*',
            'https://wx2.qq.com/?&lang*',
            'https://login.wx2.qq.com/jslogin*'
        ]
    }, (details) => { handleRequest(details); });
}

if (app.requestSingleInstanceLock()) {

    app.whenReady().then(() => {
        RequestHook();

        Bro = new BrowserWindow({
            show: false,
            autoHideMenuBar: true,
            icon: path.join(__dirname, 'assets/original/icon_tray_important.png'),
            webPreferences: {
                webSecurity: false,
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        Bro.loadURL('https://wx2.qq.com/');  //以后添加cookie缓存时，要用到这个地址

        Bro.webContents.on('dom-ready', () => {
            LoadExtrResource(Bro);
            Bro.show();
            Bro.focus();
        })

        Bro.on('close', (e) => {
            if (Bro.isVisible()) {
                e.preventDefault();
                Bro.hide();
            }
        });

        Bro.webContents.on('new-window', openInBrowser);

        ipcMain.on('resizeWindow', (event, value) => {
            if (value === 'desktop') {
                Bro.setSize(1000, Bro.getSize()[1], true);
            } else {
                Bro.setSize(450, Bro.getSize()[1], true);
            }
        });

        InitMenu();

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('before-quit', () => {
            if (tray != null) {
                tray.destroy();
            }
        });

        app.on('activate', () => {
            Bro.show();
            Bro.focus();
        });

    });
} else {
    app.quit();
}

function toggle() {
    if (Bro.isVisible()) {
        Bro.hide();
    } else {
        Bro.show();
    }
}

function createTrayIcon() {
    switch (this.platform) {
        case 'darwin':
            let trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets/icon.png'))
            trayIcon.setTemplateImage(true)
            return trayIcon
        default:
            return nativeImage.createFromPath(path.join(__dirname, 'assets/original/icon_tray.png'))
    }
}

function login() {
    Bro.hide();
    Bro.setSize(1000, 800, true);
    Bro.setResizable(true);
    Bro.show();
}

function logout() {
    Bro.setSize(380, 500, true);
    Bro.setResizable(false);
}

function handleRequest(details) {
    details.url.startsWith('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit') && login()
    details.url.startsWith('https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxinit') && login()
    details.url.startsWith('https://wx.qq.com/?&lang') && logout()
    details.url.startsWith('https://wx2.qq.com/?&lang') && logout()
    details.url.startsWith('https://login.wx2.qq.com/jslogin') && Bro.loadURL(link);
}

function openInBrowser(e, url) {
    e.preventDefault();
    let redirectUrl = url;
    if (url.startsWith('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxcheckurl?requrl=')) {
        let redirectRegexp = /https:\/\/wx\.qq\.com\/cgi-bin\/mmwebwx-bin\/webwxcheckurl\?requrl=(.*)&skey.*/g;
        redirectUrl = decodeURIComponent(redirectRegexp.exec(url)[1]);
    }
    shell.openExternal(redirectUrl);
}

function LoadExtrResource(Bro) {

    Bro.webContents.insertCSS('body {overflow: hidden;}.logo, .lang, .copyright {display: none !important;}.login_box {top: 0 !important;left: 0 !important;margin: 0 !important;}.main {padding: 0 !important;height: 100% !important;}.main_inner {max-width: 100% !important;}a.web_wechat_screencut {display: none;}span.display_name {width: 130px !important;}i.toggle-mobile-button {display: table-cell;padding: 12px 0 0 12px;cursor: pointer;color: gray;transition: 0.5s ease-out;}i.toggle-mobile-button.mini {margin: 12px 12px 0 0;display: block;}.panel {transition: width .2s;}.mini .panel {width: 80px;}.mini #chatArea {width: calc(100vw - 80px);}.mini .panel .nickname {display: none;}.mini .panel .search_bar {display: none;}.mini .panel .tab {display: none;}.mini .panel .nav_view {top: 100px;}.mini .panel .ext {display: none;}');
    Bro.webContents.executeJavaScript(`
            let faLink = document.createElement('link');
            faLink.setAttribute('rel', 'stylesheet');
            faLink.type = 'text/css';
            faLink.href = 'https://use.fontawesome.com/releases/v5.0.13/css/all.css';
            faLink.integrity = 'sha384-DNOHZ68U8hZfKXOrtjWvjxusGo9WQnrNx2sqG0tfsghAvtVlRW3tvkXWZh58N9jp';
            faLink.crossOrigin = 'anonymous';
            document.head.appendChild(faLink);

            var titleName = 'Electron WeChat (version: ${app.getVersion()})';
            document.title = titleName;
            new MutationObserver(mutations => {
                if (document.title !== titleName) {
                    document.title = titleName;
                }
            }).observe(document.querySelector('title'), {childList: true});

            new MutationObserver(mutations => {
                let unread = document.querySelector('.icon.web_wechat_reddot');
                let unreadImportant = document.querySelector('.icon.web_wechat_reddot_middle');
                let unreadType = unreadImportant ? 'important' : unread ? 'minor' : 'none';
                require('electron').ipcRenderer.send('updateUnread', unreadType);
            }).observe(document.querySelector('.chat_list'), {subtree: true, childList: true});

            let toggleButton = document.createElement('i');
            toggleButton.className = 'toggle-mobile-button fas fa-mobile-alt';
            toggleButton.onclick = () => {
                if (toggleButton.classList.contains('mini')) {
                    toggleButton.className = 'toggle-mobile-button fas fa-mobile-alt';
                    require('electron').ipcRenderer.send('resizeWindow', 'desktop');
                } else {
                    toggleButton.className = 'toggle-mobile-button fas fa-desktop mini';
                    require('electron').ipcRenderer.send('resizeWindow', 'mobile');
                }

                document.querySelector('div.main').classList.toggle('mini');
            };
            let titleBar = document.querySelector('.header');
            titleBar.appendChild(toggleButton);

            document.getElementsByClassName('ChatListBanner_Close')[0].click();
        `);
}

function cleanupAndExit() {
    app.exit(0);
}

function getUnreadImage(value) {
    unreadType = value
    switch (value) {
        case 'important':
            if ('darwin' === platform) {
                let trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets/iconImportant.png'));
                return trayIcon;
            } else {
                return nativeImage.createFromPath(path.join(__dirname, 'assets/original/icon_tray_important.png'));
            }
        case 'minor':
            if ('darwin' === platform) {
                let trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets/iconUnread.png'));
                return trayIcon;
            } else {
                return nativeImage.createFromPath(path.join(__dirname, 'assets/original/icon_tray_unread.png'));
            }
        default:
            if ('darwin' === platform) {
                let trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets/icon.png'));
                trayIcon.setTemplateImage(true);
                return trayIcon;
            } else {
                return nativeImage.createFromPath(path.join(__dirname, 'assets/original/icon_tray.png'));
            }
    }
}

function InitMenu() {
    tray = new Tray(createTrayIcon());
    tray.setToolTip('WeChat Desktop');

    let context = Menu.buildFromTemplate([{
        label: '切换聊天窗口',
        click: () => toggle()
    },
    {
        label: '退出',
        click: () => cleanupAndExit()
    }
    ]);

    tray.setContextMenu(context);

    tray.on('click', () => toggle());

    ipcMain.on('updateUnread', (event, value) => {
        value !== unreadType && tray.setImage(getUnreadImage(value))
    });
}