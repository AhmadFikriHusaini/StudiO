import { ApiState, UserState } from "../../types/app";

export type User = ApiState<UserState[]>;

export const initialUser: User = {
    data: [{
        id: null,
        username: "",
        fullname: "",
        email: "",
        department: "",
        firstaccess: null,
        lastaccess: null,
        auth: "",
        suspended: null,
        confirmed: null,
        lang: "",
        theme: "",
        timezone: "",
        mailformat: null,
        trackforums: null,
        description: "",
        descriptionformat: null,
        country: "",
        profileimageurlsmall: "",
        profileimageurl: "",
        preferences: [{
            name: "",
            value: "",
        }],
    }],
    status: "idle",
    error: null,
}