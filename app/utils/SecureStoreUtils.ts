import * as SecureStore from "expo-secure-store";

const stdMessage = "SecureStoreUtils.ts Error: "

export const storeUserId = {
    async storeUserId(userId: string) {
        try {
            await SecureStore.setItemAsync("userId", userId);
        } catch (error) {
            console.log(stdMessage, error);
        }
    },
    async getUserId() {
        try {
            return await SecureStore.getItemAsync("userId");
        } catch (error) {
            console.log(stdMessage, error);
        }
    },
    async removeUserId() {
        try {
            await SecureStore.deleteItemAsync("userId");
        } catch (error) {
            console.log(stdMessage, error);
        }
    },
    getUserIdSync() {
        return SecureStore.getItem("userId");
    },
    setUserIdSync(userId: string) {
        SecureStore.setItem("userId", userId);
    },
};

export const storeToken = {
    async storeToken(token: string) {
        try {
            await SecureStore.setItemAsync("token", token);
        } catch (error) {
            console.log(stdMessage, error);
        }
    },
    async getToken() {
        try {
            return await SecureStore.getItemAsync("token");
        } catch (error) {
            console.log(stdMessage, error);
        }
    },
    async removeToken() {
        try {
            await SecureStore.deleteItemAsync("token");
        } catch (error) {
            console.log(stdMessage, error);
        }
    },
    getTokenSync() {
        return SecureStore.getItem("token");
    },
    setTokenSync(token: string) {
        SecureStore.setItem("token", token);
    },
};

export const storeUsername = {
    async storeUsername(username: string) {
        try {
            await SecureStore.setItemAsync("username", username);
        } catch (error) {
            console.log(stdMessage, error);
        }
    },
    async getUsername() {
        try {
            return await SecureStore.getItemAsync("username");
        } catch (error) {
            console.log(stdMessage, error);
        }
    },
    async removeUsername() {
        try {
            await SecureStore.deleteItemAsync("username");
        } catch (error) {
            console.log(stdMessage, error);
        }
    },
    getUsernameSync() {
        return SecureStore.getItem("username");
    },
    setUsernameSync(username: string) {
        SecureStore.setItem("username", username);
    },
};

export const storeQuizAttempt = {
    async storeQuizAttempt(quizAttempt: string) {
        try {
            await SecureStore.setItemAsync("quizAttempt", quizAttempt);
        } catch (error) {
            console.log(stdMessage, error);
        }
    },
    async getQuizAttempt() {
        try {
            return await SecureStore.getItemAsync("quizAttempt");
        } catch (error) {
            console.log(stdMessage, error);
        }
    },
    async removeQuizAttempt() {
        try {
            await SecureStore.deleteItemAsync("quizAttempt");
        } catch (error) {
            console.log(stdMessage, error);
        }
    },
    getQuizAttemptSync() {
        return SecureStore.getItem("quizAttempt");
    },
    setQuizAttemptSync(quizAttempt: string) {
        SecureStore.setItem("quizAttempt", quizAttempt);
    },
};