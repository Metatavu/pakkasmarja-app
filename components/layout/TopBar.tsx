import React from "react";
import { AccessToken } from "../../types";
import { Thumbnail } from "native-base";
import { TOP_LOGO } from "../../static/images";
import { Dimensions, View } from "react-native";

/**
 * Top bar component
 */
const TopBar = () => {
  return (
    <Thumbnail
      source={ TOP_LOGO }
      style={{
        width: 80,
        height: 80
      }}
    />
  );
}

export default TopBar;
