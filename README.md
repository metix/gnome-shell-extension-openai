# ChatGPT / OpenAI GNOME Extension

![desktop.gif](docs/desktop.gif)
![screenshot-overlay.png](docs%2Fscreenshot-overlay.png)

## ChatGPT Overlay for GNOME Shell

---

<div align="center">
This is a simple extension that uses the OpenAI API to display a ChatGPT Overlay by pressing


`Super + G`.


Note: API-Key is required for this extension.
If you look for an extension without API-Key you can
use [this one](https://github.com/HorrorPills/ChatGPT-Gnome-Desktop-Extension)
</div>

---

#### Features

- Supports Light/Dark Mode
- Settings UI
- Clear History (Shortcut: CTRL+L)
- Optional System Prompt (Initial prompt for all questions)

## Install From Source

This method installs to your `~/.local/share/gnome-shell/extensions` directory from the latest source code on the main
branch.

Clone this repository:

```bash
git clone https://github.com/metix/gnome-shell-extension-openai && cd gnome-shell-extension-openai
```

Install the extension:

```bash
make install
```

Restart desktop:

- On X11: `ALT+F2` then type `r`
- On Wayland: Log-out and Log-In again

Enable the extension:

```bash
gnome-extensions enable openai-gnome@etixsoftware.de
```

Open the settings dialog and paste your OpenAI-API-Key:

```bash
gnome-extensions prefs openai-gnome@etixsoftware.de
```

Show the overlay with the shortcut:

```
-> Super+G to show the overlay
```

## Compatibility

The Extension was tested on:

- Ubuntu 22.04 with X11

Feel free to contribute if you found bugs or improved something.

## FAQ
#### Where can I get an OpenAI API-Key?
First you need to create an Account on [OpenAI](https://openai.com/blog/openai-api).

From your user profile, you can manage your API keys by selecting "Manage API Keys".

## Troubleshooting

- Restart GNOME Shell (`ALT+F2`, then type `r`)
- Look for error messages in

```
journalctl /usr/bin/gnome-shell
```

## License
This Extension has been released under The GNU General Public License v3.0.