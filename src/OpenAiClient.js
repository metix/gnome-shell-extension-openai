const {Soup} = imports.gi;
const Gio = imports.gi.Gio;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.Utils;

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-3.5-turbo"

const oldSoup = Soup.get_major_version() === 2;

var OpenAiClient = class OpenAiClient {

    constructor() {
        this.chatHistory = [];
    }

    ask(question) {
        return new Promise((resolve, reject) => {
            let systemPrompt = Utils.getSettings().get_string("system-prompt");

            let messages;
            if (systemPrompt.length > 0) {
                messages = [
                    {role: 'system', content: systemPrompt},
                    ...this.chatHistory,
                    {role: 'user', content: question}
                ]
            } else {
                messages = [...this.chatHistory, {role: 'user', content: question}]
            }

            let body = JSON.stringify({
                model: OPENAI_MODEL,
                messages: messages
            });

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
        this.chatHistory.push({role: "assistant", content: answer})
    }

    _loadJsonAsync(url, body) {
        return new Promise((resolve, reject) => {

            let debugMode = Utils.getSettings().get_boolean("debug-mode");

            if (debugMode) {
                let parsedBody = JSON.parse(body);
                let debugMessage = `Hi, I am not chat-GPT i'm just a test response.`;
                if (parsedBody.messages[parsedBody.messages.length - 1].content === ':body')
                    debugMessage = body;

                setTimeout(() => {
                    resolve({
                        choices: [{
                            message: {
                                content: debugMessage
                            }
                        }]
                    })
                }, 500)

                return;
            }

            let httpSession = new Soup.Session();
            let message = Soup.Message.new('POST', url);

            let token = Utils.getSettings().get_string("openai-api-key");

            message.request_headers.append(
                'Authorization',
                `Bearer ${token}`
            )

            function processResponse(message) {
                {
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
                }
            }

            if (oldSoup) {
                message.set_request('application/json', 2, body);
                httpSession.queue_message(message, () => processResponse(message));
            } else {
                message.set_request_body('application/json', Gio.MemoryInputStream.new_from_bytes(body));
                httpSession.send_and_read_async(message, 0, null, (_httpSession, _message) => processResponse(message))
            }
        });
    }
}