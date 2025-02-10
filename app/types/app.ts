export interface ApiState<T> {
    data: T;
    status: "idle" | "loading" | "success" | "failed";
    error: string | null;
}

export interface AuthState {
    isLogin: boolean;
    userid: string | null;
}

export interface UserState {
    id: number | null;
    username: string;
    fullname: string;
    email: string;
    department: string;
    firstaccess: number | null;
    lastaccess: number | null;
    auth: string;
    suspended: boolean | null;
    confirmed: boolean | null;
    lang: string;
    theme: string;
    timezone: string;
    mailformat: number | null;
    trackforums: number | null;
    description: string;
    descriptionformat: number | null;
    country: string;
    profileimageurlsmall: string;
    profileimageurl: string;
    preferences: [{
        name: string;
        value: string;
    }];
}

export interface CourseState {
    id: number | null;
    shortname: string;
    fullname: string;
    displayname: string;
    enrolledusercount: number | null;
    idnumber: string;
    visible: number | null;
    summary: string;
    summaryformat: number | null;
    format: string;
    courseimage: string;
    showgrades: boolean | null;
    lang: string;
    enablecompletion: boolean | null;
    completionhascriteria: boolean | null;
    completionusertracked: boolean | null;
    category: number | null;
    progress: number | null;
    completed: boolean | null;
    startdate: number | null;
    enddate: number | null;
    marker: number | null;
    lastaccess: number | null;
    isFavorite: boolean | null;
    hidden: boolean | null;
    overviewfiles: any;
    showactivitydates: boolean | null;
    showcompletionconditions: boolean | null;
    timemodified: number | null;
}

export interface studentState {
    fullname: string;
    profileimageurlsmall: string;
}
export interface AssignmentStatusState {
    submission: {
        id: number | null
        userid: number | null
        attemptnumber: number | null
        timecreated: number | null
        timemodified: number | null
        timestarted: number | null
        status: string
        groupid: number | null
        assignment: number | null
    },
    locked: boolean
    feedback: {
        grade: {
            id: number
            attemptnumber: number
            grade: string
        }
        gradefordisplay: string
        plugins: [{
            type: string
            name: string
            fileareas: [{
                area: string
                files: any[]
            }]
            editorfields: [{
                name: string
                description: string
                text: string
                format: number
            }]
        }]
    } | null
}

export type AssigmentProps = {
    id: number | null;
    cmid: number | null;
    course: number | null;
    name: string;
    allowsubmissionsfromdate: number;
    duedate: number;
    cutoffdate: number;
    configs: [
        {
            plugin: string;
            subtype: string;
            name: string;
            value: string;
        }
    ];
    intro: string;
    introattachments: [
        {
            filename: string;
            fileurl: string;
            mimetype: string;
        }
    ];
    timelimit: number | null;
};

export interface AssignmentState {
    courses: [
        {
            id: number | null
            assignments: [
                AssigmentProps
            ]
        }
    ]


}