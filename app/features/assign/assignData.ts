import { ApiState, AssignmentState, AssignmentStatusState } from "../../types/app";

export type AssignmentStatus = ApiState<AssignmentStatusState>;

export const initialAssignmentStatus: AssignmentStatus = {
    data: {
        submission: {
            id: null,
            userid: null,
            attemptnumber: null,
            timecreated: null,
            timemodified: null,
            timestarted: null,
            status: "new",
            groupid: null,
            assignment: null,
        },
        locked: false,
        feedback: null
    },
    status: "idle",
    error: null,
}

export type Assignment = ApiState<AssignmentState>;

export const initialAssignment: Assignment = {
    data: {
        courses: [
            {
                id: null,
                assignments: [
                    {
                        id: null,
                        cmid: null,
                        course: null,
                        name: "",
                        allowsubmissionsfromdate: 0,
                        duedate: 0,
                        cutoffdate: 0,
                        configs: [
                            {
                                plugin: "",
                                subtype: "",
                                name: "",
                                value: "",
                            }
                        ],
                        intro: "",
                        introattachments: [
                            {
                                filename: "",
                                fileurl: "",
                                mimetype: "",
                            }
                        ],
                        timelimit: null,
                    }
                ]
            }
        ]
    },
    status: "idle",
    error: null,
}