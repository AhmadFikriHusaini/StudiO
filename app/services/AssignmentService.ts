import { AxiosInstance } from "axios";

const qs = require('qs');

const AssignmentService = {
    getAssignmentModule: async (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
    }) => AxiosInstance.get("webservice/rest/server.php", { params }),
    UploadFile: async (AxiosInstance: AxiosInstance, data: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
        contextlevel: string,
        instanceid: string | null,
        component: string,
        filearea: string,
        itemid: number,
        filepath: string,
        filename: string,
        filecontent: string,
    }) => {
        const formData = new FormData();
        formData.append("wstoken", data.wstoken || "");
        formData.append("wsfunction", data.wsfunction);
        formData.append("moodlewsrestformat", data.moodlewsrestformat);
        formData.append("contextlevel", data.contextlevel);
        formData.append("instanceid", data.instanceid || "");
        formData.append("component", data.component);
        formData.append("filearea", data.filearea);
        formData.append("itemid", data.itemid.toString());
        formData.append("filepath", data.filepath);
        formData.append("filename", data.filename);
        formData.append("filecontent", data.filecontent);

        const response = await AxiosInstance.post("/webservice/rest/server.php", data, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },
    submitAssigment: async (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
        assignmentid: number | null | undefined,
        'plugindata[files_filemanager]': number,

    }) => {

        const config = {
            params,
            paramsSerializer: function (params: any) {
                return qs.stringify(params, { encode: false });
            }
        }

        const response = await AxiosInstance.get("/webservice/rest/server.php", config);
        return response.data;
    },
    GetAssignmentStatus: (AxiosInstance: AxiosInstance, params: {
        wstoken: string | null,
        wsfunction: string,
        moodlewsrestformat: string,
        assignid: number | null,
    }) =>
        AxiosInstance.get("/webservice/rest/server.php", { params })
}

export default AssignmentService