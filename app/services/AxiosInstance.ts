import axios from "axios";

export const createAxiosInstance = async (url: string) => {
    return axios.create({
        baseURL: url,
    })
}