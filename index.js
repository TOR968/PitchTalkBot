const axios = require("axios");
const fs = require("fs").promises;
const querystring = require("querystring");
const { HttpsProxyAgent } = require("https-proxy-agent");

const BASE_URL = "https://api.pitchtalk.app/v1/api";

let maxTimer = 0;

const colors = {
    reset: "\x1b[0m",
    blue: "\x1b[34m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
    orange: "\x1b[38;2;255;165;0m",
};

const processTasks = async (api, tasks) => {
    console.log(`${colors.green}Processing Tasks...${colors.reset}`);

    let hasShareXPost = false;
    let hasShareTikTokStory = false;

    for (const task of tasks) {
        if (task.template.title === "Subscribe to PitchTalk chanel" && task.status === "INITIAL") {
            console.log(
                `${colors.red}First, complete the mandatory task "Subscribe to PitchTalk chanel".${colors.reset}`
            );
            return;
        }

        if (task.template.title === "Join PitchTalk Chat" && task.status === "INITIAL") {
            console.log(`${colors.red}First, complete the mandatory task "Join PitchTalk Chat".${colors.reset}`);
            return;
        }

        await processTask(api, task);
        randomDelay();

        if (task.template.title === "Share X Post") {
            hasShareXPost = true;
        }
        if (task.template.title === "Share TikTok Story") {
            hasShareTikTokStory = true;
        }
    }

    if (!hasShareXPost) {
        await startDailyTask(api, "share-x", generateRandomUrl("x.com"));
        randomDelay();
        statusLog("VERIFY_REQUESTED", "Share X Post");
    }

    if (!hasShareTikTokStory) {
        await startDailyTask(api, "share-tiktok", generateRandomUrl("tiktok.com"));
        randomDelay();
        statusLog("VERIFY_REQUESTED", "Share TikTok Story");
    }
};

const processTask = async (api, task) => {
    const { status, template } = task;
    if (status === "INITIAL") {
        if (
            template.type === "BASIC" &&
            ["Follow PitchTalk on YouTube", "Follow PitchTalk on X"].includes(template.title)
        ) {
            await startBasicTask(api, task);
        } else if (template.type === "DAILY") {
            if (template.title === "Share X Post") {
                statusLog(status, template.title);
            } else if (template.title === "Share TikTok Story") {
                statusLog(status, template.title);
            }
        } else {
            statusLog(status, template.title);
        }
    } else {
        statusLog(status, template.title);
    }
};

const randomDelay = async () => {
    const delay = getRandomNumber(2000, 5000);
    return new Promise((resolve) => setTimeout(resolve, delay));
};

const statusLog = (status, title) => {
    switch (status) {
        case "COMPLETED_CLAIMED":
            console.log(`${colors.green} ✅ COMPLETED: ${title} ${colors.reset}`);
            break;
        case "VERIFY_REQUESTED":
            console.log(`${colors.yellow} 🟡 VERIFYING: ${title} ${colors.reset}`);
            break;
        case "INITIAL":
            console.log(`${colors.blue} 🟢 IN PROGRESS: ${title} ${colors.reset}`);
            break;
        default:
            console.log(`${colors.red} 🔴 NOT DONE: ${title} ${colors.reset}`);
            break;
    }
};

const startBasicTask = async (api, task) => {
    console.log(`${colors.yellow}--- Executing task ${task.template.title} ---${colors.reset}`);
    await api.post(`/tasks/${task.id}/start`);
    console.log(`${colors.green}Task ${task.template.title} Started...${colors.reset}`);
};

const startDailyTask = async (api, slug, proof) => {
    console.log(`${colors.yellow}--- Executing task ${slug} ---${colors.reset}`);
    await api.post(`/tasks/create-daily`, { slug, proof });
    console.log(`${colors.green}Task ${slug} Started...${colors.reset}`);
};

const generateRandomUrl = (domain) => {
    const randomNick = generateRandomString(getRandomNumber(6, 12));
    const randomId = generateRandomString(19, "0123456789");
    return domain === "x.com"
        ? `https://x.com/${randomNick}/status/${randomId}`
        : `https://www.tiktok.com/@${randomNick}/video/${randomId}?is_from_webapp=1&sender_device=pc`;
};

const processFarming = async (api) => {
    const farmingInfo = await api.get(`/farmings`);
    const endTime = new Date(farmingInfo.endTime);
    const currentTime = new Date();
    console.log(`${colors.green}Farming...${colors.reset}`);

    if (endTime < currentTime) {
        await api.post(`/users/claim-farming`);
        console.log(`${colors.green}Farming Reward Claimed${colors.reset}`);
        console.log(`${colors.magenta}Next claim in 6 hours${colors.reset}`);

        const timer = 6 * 60 * 60 * 1000;
        setMaxTimer(timer);
    } else {
        const timeDifference = endTime - currentTime;
        const { hours, minutes, seconds } = getTimeRemaining(timeDifference);
        console.log(`${colors.magenta}Farming is not ready yet.${colors.reset}`);
        console.log(
            `${colors.magenta}Remaining: ${hours} hours, ${minutes} minutes, ${seconds} seconds.${colors.reset}`
        );

        const timer = hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;
        setMaxTimer(timer);
    }
};

const getTimeRemaining = (timeDifference) => {
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
    return { hours, minutes, seconds };
};

const setMaxTimer = (timer) => {
    maxTimer = maxTimer < timer ? timer : maxTimer;
};

const processAccount = async (hash, proxy) => {
    try {
        const parsedParams = querystring.parse(hash);
        const hashData = JSON.parse(decodeURIComponent(parsedParams.user));
        const authBody = {
            telegramId: hashData.id.toString(),
            username: hashData.username,
            hash: hash,
            referralCode: parsedParams?.start_param ? parsedParams?.start_param : "",
            photoUrl: "",
        };

        const authResponse = await postRequest("/auth", authBody, proxy);
        const accessToken = authResponse.accessToken;
        if (!accessToken) {
            throw new Error(authResponse?.error?.message || "Unknown error");
        }

        console.log(`${colors.green}Authorization successful! Token received for ${hashData.username}.${colors.reset}`);

        const api = createApiInstance(accessToken, proxy);

        if (authResponse.dailyRewards.isNewDay) {
            console.log(`${colors.green}Daily Reward claimed!${colors.reset}`);
        }

        await processFarming(api);

        const tasks = await api.get(`/tasks`);
        await processTasks(api, tasks);

        await api.get(`/tasks/verify`);
        console.log(`${colors.green}Verify Tasks...${colors.reset}`);

        const userInfo = await api.get(`/users/me`);

        getRefRewards(api, userInfo);

        console.log(
            `${colors.green}User Info:${colors.reset} ${userInfo.username} | coins: ${userInfo.coins} | tickets: ${userInfo.tickets}`
        );
    } catch (error) {
        console.error(`${colors.red}Error processing account:${colors.reset}`, error);
    }
};

const getRefRewards = async (api, userInfo) => {
    if (userInfo.referralRewards > 0) {
        try {
            await api.post(`/users/claim-referral`);
            console.log(`${colors.green}Referral rewards claimed!${colors.reset}`);
        } catch (error) {
            console.error(`${colors.red}Error claiming referral rewards:${colors.reset}`, error);
        }
    }
};

const createApiInstance = (accessToken, proxy) => {
    const instance = axios.create({
        baseURL: BASE_URL,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        ...(proxy && { httpsAgent: new HttpsProxyAgent(proxy) }),
    });

    instance.interceptors.response.use(
        (response) => response.data,
        (error) => {
            console.error(`${colors.red}API Error:${colors.reset}`, error.response?.data || error.message);
            throw error;
        }
    );

    return instance;
};

const getProxies = async () => {
    try {
        const proxyData = await fs.readFile("proxy.txt", "utf8");
        return proxyData.split("\n").filter(Boolean);
    } catch (error) {
        console.error(`${colors.yellow}Failed to read the proxy file. Proxy will not be used.${colors.reset}`);
        return [];
    }
};

const postRequest = async (endpoint, body = {}, proxy = null) => {
    const config = {
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0",
        },
        ...(proxy && { httpsAgent: new HttpsProxyAgent(proxy) }),
    };

    try {
        const response = await axios.post(`${BASE_URL}${endpoint}`, body, config);
        return response.data;
    } catch (error) {
        console.error(`${colors.red}Error in POST ${endpoint}:${colors.reset}`, error.response?.data || error.message);
        throw error;
    }
};

const generateRandomString = (length, chars = "abcdefghijklmnopqrstuvwxyz0123456789") => {
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
};

const getRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const scheduleNextRun = () => {
    const randomDelay = getRandomNumber(600000, 2400000);
    const totalDelay = maxTimer + randomDelay;
    const startTime = Date.now();
    const endTime = startTime + totalDelay;

    const timerInterval = setInterval(() => updateTimer(endTime, timerInterval), 1000);

    setTimeout(() => {
        clearInterval(timerInterval);
        main();
    }, totalDelay);
};

const updateTimer = (endTime, timerInterval) => {
    const currentTime = Date.now();
    const remainingTime = endTime - currentTime;

    if (remainingTime <= 0) {
        clearInterval(timerInterval);
        return;
    }

    const { hours, minutes, seconds } = getTimeRemaining(remainingTime);
    process.stdout.write(`\r${colors.orange}--- Restarting in ${hours}h ${minutes}m ${seconds}s ---${colors.reset}`);
};

const main = async () => {
    try {
        const proxies = await getProxies();
        const hashes = (await fs.readFile("data.txt", "utf8")).split("\n").filter(Boolean);

        for (let i = 0; i < hashes.length; i++) {
            console.log(
                `${colors.blue}--- Start processing account ${i + 1} | proxy: ${proxies[i] || null} ---${colors.reset} `
            );
            await processAccount(hashes[i].trim(), proxies[i] || null);
            console.log(`${colors.blue}--- Finished processing account ${i + 1} ---${colors.reset}`);
        }

        console.log(`${colors.blue}--- All ${hashes.length} accounts processed ---${colors.reset}`);

        scheduleNextRun();
    } catch (error) {
        console.error(`${colors.red}Error in main function:${colors.reset}`, error);
    }
};

main();
