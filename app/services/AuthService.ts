import { AxiosInstance } from "axios";

const AuthService = {
    login: (AxiosInstance: AxiosInstance, params: {
        username: string,
        password: string,
        service: string
    }) => AxiosInstance.get("/login/token.php", { params }),
    getUserId: (AxiosInstance: AxiosInstance, params: {
        wstoken: string,
        wsfunction: string,
        moodlewsrestformat: string
    }) => AxiosInstance.get("/webservice/rest/server.php", { params })
}

export default AuthService;