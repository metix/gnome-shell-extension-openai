# Basic Makefile

UUID = $(shell grep -E '^[ ]*"uuid":' ./metadata.json | sed 's@^[ ]*"uuid":[ ]*"\(.\+\)",[ ]*@\1@')
BASE_MODULES = metadata.json
SRC_MODULES = extension.js prefs.js OpenAiClient.js Overlay.js Utils.js stylesheet.css
ifeq ($(strip $(DESTDIR)),)
INSTALLBASE = $(HOME)/.local/share/gnome-shell/extensions
else
INSTALLBASE = $(DESTDIR)/usr/share/gnome-shell/extensions
endif
INSTALLNAME = $(UUID)

$(info UUID is "$(UUID)")
$(info base location is "$(INSTALLBASE)")

.PHONY: all clean extension install install-local zip-file

all: extension

clean:
	rm -f ./schemas/gschemas.compiled
	rm -rf _build

extension: ./schemas/gschemas.compiled

./schemas/gschemas.compiled: ./schemas/org.gnome.shell.extensions.etixsoftware.openai.gschema.xml
	glib-compile-schemas ./schemas/

install: install-local

install-local: _build
	rm -rf $(INSTALLBASE)/$(UUID)
	mkdir -p $(INSTALLBASE)/$(UUID)
	cp -r ./_build/* $(INSTALLBASE)/$(UUID)/
ifeq ($(INSTALLTYPE),system)
	# system-wide settings and locale files
	rm -r  $(addprefix $(INSTALLBASE)/$(UUID)/, schemas locale COPYING)
	mkdir -p $(SHARE_PREFIX)/glib-2.0/schemas \
		$(SHARE_PREFIX)/locale \
		$(SHARE_PREFIX)/licenses/$(PKG_NAME)
	cp -r ./schemas/*gschema.xml $(SHARE_PREFIX)/glib-2.0/schemas
	cp -r ./_build/locale/* $(SHARE_PREFIX)/locale
	cp -r ./_build/COPYING $(SHARE_PREFIX)/licenses/$(PKG_NAME)
endif
	-rm -fR _build
	echo done

zip-file: _build
	cd _build ; \
	zip -qr "$(PKG_NAME)$(ZIPVER).zip" .
	mv _build/$(PKG_NAME)$(ZIPVER).zip ./
	-rm -fR _build

_build: all
	-rm -fR ./_build
	mkdir -p _build/preferences
	cp $(BASE_MODULES) $(addprefix src/, $(SRC_MODULES)) _build
	mkdir -p _build/schemas
	cp schemas/*.xml _build/schemas/
	cp schemas/gschemas.compiled _build/schemas/