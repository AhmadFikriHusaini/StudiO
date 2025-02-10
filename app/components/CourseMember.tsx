import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { storeToken, storeUserId } from "../utils/SecureStoreUtils";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import CourseService from "../services/CourseService";
import ErrorView from "./ErrorView";
import { backendUrlDatabases } from "../utils/sql/transaction";
import { useSQLiteContext } from "expo-sqlite";
import { createAxiosInstance } from "../services/AxiosInstance";

type GroupProps = {
  id: number;
  name: string;
};

type RoleProps = {
  shortname: string;
};

type CourseMemberProps = {
  id: number;
  fullname: string;
  profileimageurlsmall: string;
  groups?: GroupProps[];
  roles: RoleProps[];
};

const CourseMember = ({ courseid }: { courseid: number }) => {
  const db = useSQLiteContext();
  const backendUrl = backendUrlDatabases();
  const [members, setMembers] = useState<CourseMemberProps[]>([]);
  const [groupedMembers, setGroupedMembers] = useState<
    { group: GroupProps; members: CourseMemberProps[] }[]
  >([]);
  const [groupToggles, setGroupToggles] = useState<Record<number, boolean>>({});
  const [showMember, setShowMember] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isError, setIsError] = useState<{
    state: boolean;
    message: string;
  }>({ state: false, message: "" });

  // Function to handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    try {
      fetchMembers();
    } finally {
      setRefreshing(false);
    }
  };

  // Function to fetch course members and organize them by groups
  const fetchMembers = async () => {
    setIsFetching(true);
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const params = {
      wsfunction: "core_enrol_get_enrolled_users",
      wstoken: storeToken.getTokenSync(),
      moodlewsrestformat: "json",
      courseid,
    };
    try {
      const response = await CourseService.getMembersByCourseId(
        instance,
        params
      );
      const currentUserId = parseInt(storeUserId.getUserIdSync() ?? "0");
      setMembers(response);
      const currentUser = response.find(
        (member: any) => member.id === currentUserId
      );
      const userGroups = currentUser?.groups || [];
      const grouped = userGroups.map((group: any) => ({
        group,
        members: response.filter((member: any) =>
          member.groups?.some((g: any) => g.id === group.id)
        ),
      }));

      setGroupedMembers(grouped);
      const initialGroupToggles = userGroups.reduce(
        (acc: any, group: any) => ({ ...acc, [group.id]: true }),
        {}
      );
      setGroupToggles(initialGroupToggles);
    } catch (error) {
      setIsError({ state: true, message: "Error Getting Data" });
    } finally {
      setIsFetching(false);
    }
  };
  const toggleGroup = (groupId: number) => {
    setGroupToggles((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#121568"]}
        />
      }
      className="flex-1 pt-4 px-4 bg-[#f5f5f5]"
      contentContainerClassName={`${isError.state && "flex-1"}`}
    >
      {isError.state ? (
        <ErrorView
          className="flex-1 items-center justify-center"
          errorMessage={isError.message}
        />
      ) : isFetching ? (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Array.from({ length: 9 }).map((_, index) => (
              <View key={index} className="mb-4 mx-2">
                <ShimmerPlaceholder
                  style={styles.GroupMember}
                  LinearGradient={LinearGradient}
                />
              </View>
            ))}
          </ScrollView>
          {Array.from({ length: 9 }).map((_, index) => (
            <View key={index} className="mb-4 mx-2">
              <ShimmerPlaceholder
                style={styles.CourseMember}
                LinearGradient={LinearGradient}
              />
            </View>
          ))}
        </View>
      ) : (
        members && (
          <View className="mx-2">
            {/* Render Group Members */}
            {groupedMembers.map(({ group, members }) => (
              <View key={group.id}>
                <View className="flex-row items-center mb-2 justify-between">
                  <Pressable onPress={() => toggleGroup(group.id)}>
                    <Text className="font-bold">{group.name} Members</Text>
                  </Pressable>
                  <Pressable onPress={() => toggleGroup(group.id)}>
                    <Ionicons
                      name={`${
                        groupToggles[group.id]
                          ? "chevron-down"
                          : "chevron-forward"
                      }`}
                      size={20}
                      color="black"
                    />
                  </Pressable>
                </View>
                {groupToggles[group.id] && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {members.map((member, index) => (
                      <View
                        key={index}
                        className="bg-white h-20 shadow border border-gray-50 mt-1 flex-row items-center px-4 gap-4 rounded-xl mb-4 mx-2"
                      >
                        <Image
                          source={
                            member.profileimageurlsmall
                              ? { uri: member.profileimageurlsmall }
                              : require("../../assets/profileSmall.png")
                          }
                          className="rounded-full h-12 w-12"
                        />
                        <Text numberOfLines={2} className="font-medium">
                          {member.fullname}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            ))}

            {/* Render Course Members */}
            <View className="flex-row items-center mb-2 justify-between">
              <Pressable onPress={() => setShowMember(!showMember)}>
                <Text className="font-bold">Course Members</Text>
              </Pressable>
              <Pressable onPress={() => setShowMember(!showMember)}>
                <Ionicons
                  name={`${showMember ? "chevron-down" : "chevron-forward"}`}
                  size={20}
                  color="black"
                />
              </Pressable>
            </View>
            {showMember &&
              members.map((member, index) => (
                <View
                  key={index}
                  className="bg-white h-20 shadow border border-gray-50 flex-row items-center pl-4 gap-4 rounded-xl mb-4 mx-2"
                >
                  <Image
                    source={
                      member.profileimageurlsmall
                        ? { uri: member.profileimageurlsmall }
                        : require("../../assets/profileSmall.png")
                    }
                    className="rounded-full h-12 w-12"
                  />
                  <View className="flex-row flex-grow items-center justify-between mx-4">
                    <Text className="font-medium">{member.fullname}</Text>
                    <View className="flex-row gap-2">
                      {member.roles.map((role, roleIndex) => (
                        <Text
                          key={roleIndex}
                          className="bg-gray-200 px-2 py-1 text-sm rounded-full"
                        >
                          {role.shortname === "editingteacher"
                            ? "teacher"
                            : role.shortname}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
          </View>
        )
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  CourseMember: {
    width: "100%",
    height: 65,
    borderRadius: 10,
  },
  GroupMember: {
    width: 90,
    height: 65,
    borderRadius: 10,
  },
});

export default CourseMember;
