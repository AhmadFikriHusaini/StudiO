import { ApiState, AuthState } from "../../types/app";
import * as SecureStore from 'expo-secure-store';
import { storeToken, storeUserId } from "../../utils/SecureStoreUtils";

export type Auth = ApiState<AuthState>;

export const initialState: Auth = {
    data: {
        isLogin: storeToken.getTokenSync() ? true : false,
        userid: storeUserId.getUserIdSync() ? storeUserId.getUserIdSync() : null,
    },
    status: "idle",
    error: null,
};
