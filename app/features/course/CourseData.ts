import { ApiState, CourseState } from "../../types/app";

export type Course = ApiState<CourseState[]>;

export const initialCourse: Course = {
    data: [{
        id: null,
        shortname: "",
        fullname: "",
        displayname: "",
        enrolledusercount: null,
        idnumber: "",
        visible: null,
        summary: "",
        summaryformat: null,
        format: "",
        courseimage: "",
        showgrades: null,
        lang: "",
        enablecompletion: null,
        completionhascriteria: null,
        completionusertracked: null,
        category: null,
        progress: null,
        completed: null,
        startdate: null,
        enddate: null,
        marker: null,
        lastaccess: null,
        isFavorite: null,
        hidden: null,
        overviewfiles: [],
        showactivitydates: null,
        showcompletionconditions: null,
        timemodified: null,
    }],
    status: "idle",
    error: null,
}