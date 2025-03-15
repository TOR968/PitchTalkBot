# PitchTalkBot

| ✅  | Feature                     |
| --- | --------------------------- |
| ✅  | Performs farming operations |
| ✅  | Handles multiple accounts   |
| ✅  | Proxy support               |
| ✅  | Claim ref rewards           |
| ✅  | Random restart timer |
| ✅  | Play snow battle       |
| ✅  | Refill energy       |
| ❌  | Play PVP       |

## For suggestions or to report a bug, please contact [telegram](https://t.me/tor_dev)

 !!! For the script to work correctly, be sure to complete the tasks "Join PitchTalk Chat" and "Subscribe to PitchTalk chanel" and run "Farming" for the first time

## Installation

1. Clone the repository:

    - Open your terminal or command prompt.
    - Navigate to the directory where you want to install the bot.
    - Run the following command:
        ```
        git clone https://github.com/TOR968/PitchTalkBot.git
        ```
    - This will create a new directory named `PitchTalkBot` with the project files.

2. Navigate to the project directory:

    - Change into the newly created directory:
        ```
        cd PitchTalkBot
        ```

3. Install the required dependencies:

    ```
    npm install
    ```

4. Open the `data.txt` file in a text editor and add your account tgWabAppData, one per line:

    ```
    account_1_here
    account_2_here
    account_3_here
    ```

5. If you need to use proxies, fill in the `proxy.txt` file with your proxy addresses, one per line. If not, you can leave this file empty. [example](proxy-example.txt)

## How to Get Your Account tgWabAppData

To obtain your account tgWabAppData:

1. Log in to the PitchTalk app in Telegram or Telegram Web.
2. Open your browser's Developer Tools (usually F12 or right-click and select "Inspect").
3. Go to the "Application" tab in the Developer Tools.
4. Copy tgWabAppData highlighted in red 

![img](image.png)

5. Copy this tgWabAppData and paste it into your `data.txt` file.

**Important**: Keep your account tgWabAppData secret and never share it publicly. It provides access to your account.

## Usage

To run the bot, use the following command in your terminal:

```
node index.js
```

## Disclaimer

This bot is for educational purposes only. Use it at your own risk and make sure you comply with the terms of service of the PitchTalk platform.

## License

This project is open source and available under the [MIT License](LICENSE).
