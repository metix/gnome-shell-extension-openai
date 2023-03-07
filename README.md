# ChatGPT / OpenAI GNOME Extension

![screenshot-panel.png](docs/screenshot-panel.png)
![screenshot-desktop.png](docs/screenshot-desktop.png)

## ChatGPT Overlay for GNOME Shell
This is a simple extension that uses the OpenAI API to display a ChatGPT Overlay by pressing

`Super + S`.

Please note that this extension requires the use of the OpenAI API, meaning you must provide an API-Token to utilize it.
However, if you don't have an API token or would rather not use one, there is an [alternative extension](https://github.com/HorrorPills/ChatGPT-Gnome-Desktop-Extension) available that utilizes Webkit to display ChatGPT in the browser.

## Install From Source
This method installs to your `~/.local/share/gnome-shell/extensions` directory from the latest source code on the main branch.

```bash
git clone https://gitlab.com/skrewball/openweather.git
cd chatgpt-gnome
make install

# -> restart gnome shell (ALT+F2, then type 'r') if extension is not loaded

# enable extension
gnome-extensions enable openai-gnome@etixsoftware.de

# open settings to configure your openai-api-key
gnome-extensions prefs openai-gnome@etixsoftware.de

# -> Press Super+S to open the panel
```

## Support
The Extension was tested on:
- Ubuntu 22.04

## Troubleshooting
- Restart GNOME Shell (`ALT+F2`, then type `r`)
- Look for error messages in 
```
journalctl /usr/bin/gnome-shell
```