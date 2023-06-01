import * as React from "react";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import { TouchableHighlight, View } from "react-native";

const ProfileButton = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={{ marginRight: 32 }}>
      <TouchableHighlight onPress={() => navigation.navigate("ManageContact")}>
        <Icon
          name="user"
          color="#fff"
          size={30}
        />
      </TouchableHighlight>
    </View>
  );
};

export default ProfileButton;