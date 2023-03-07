const {Soup} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.Utils;

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

var OpenAiClient = class OpenAiClient {

    constructor() {
        this.chatHistory = [];
    }

    ask(question) {
        return new Promise((resolve, reject) => {
            let body = JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [...this.chatHistory, {role: 'user', content: question}]
            });

            let debugMode = Utils.getSettings().get_boolean("debug-mode");

            if (debugMode) {

                let test = "";

                for (let i = 0; i < 100; i++) {
                    test += "afasf ";
                }

                setTimeout(() => {
                    resolve(`Hi, I am not chat-GPT i'm just a test response. ${test} testing this extension
body:
${body}`)
                }, 500)

                return;
            }

            this._loadJsonAsync(OPENAI_API_URL, body)
                .then(data => {

                    let answer = data.choices[0].message.content;

                    // save question and answer in the chat-history, so that we can append the history
                    // in the next question
                    this._saveChat(question, answer);

                    resolve(answer);
                })
                .catch(reject)
        });
    }

    clearHistory() {
        this.chatHistory = [];
    }

    _saveChat(question, answer) {
        this.chatHistory.push({role: "user", content: question})
        this.chatHistory.push({role: "system", content: answer})
    }

    _loadJsonAsync(url, body) {
        return new Promise((resolve, reject) => {
            let httpSession = new Soup.Session();
            let message = Soup.Message.new('POST', url);

            let token = Utils.getSettings().get_string("openai-api-key");

            message.request_headers.append(
                'Authorization',
                `Bearer ${token}`
            )

            message.set_request('application/json', 2, body);

            httpSession.queue_message(message, () => {
                if (message.status_code == 200) {
                    try {
                        let out = JSON.parse(message['response-body'].data);
                        resolve(out);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    if (message.status_code == 401) {
                        reject("request failed: " + message.status_code + "\nDid you provide your OpenAI-API-Key? (Open Settings)");
                    } else {
                        reject("request failed: " + message.status_code);
                    }
                }
            });
        });
    }
}