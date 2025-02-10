import { AxiosInstance } from "axios";

const qs = require('qs');

const UserService = {
    getUserProfile: (AxiosInstance: AxiosInstance, params: {
        moodlewsrestformat: string,
        wsfunction: string,
        wstoken: string,
        field: string,
        values: string[]
    }) => AxiosInstance.get("/webservice/rest/server.php", {
        params, paramsSerializer: (params) => {
            return qs.stringify(params, { arrayFormat: 'indices' })
        }
    })
}

export default UserService;