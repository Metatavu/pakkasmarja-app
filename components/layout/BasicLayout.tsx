import React from "react";
import { Container, Content, Toast, Spinner } from "native-base";
import { StyleSheet, View, ScrollView, Text, TouchableHighlight } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import strings from "../../localization/strings";

/**
 * Component properties
 */
interface Props {
  backgroundColor: string,
  loading?: boolean,
  displayFooter?: boolean
  errorMsg?: string,
  navigation: any
}

/**
 * Component state
 */
interface State {

}

const styles = StyleSheet.create({
  footer: {
    height: 60,
    borderTopColor: "rgba(0,0,0,0.5)",
    borderTopWidth: 2,
    flex: 0,
    flexDirection: "row",
    alignItems: "center", 
    justifyContent: "space-around"
  }
});

export default class BasicLayout extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.props.errorMsg && this.props.errorMsg != prevProps.errorMsg) {
      Toast.show({
        text: this.props.errorMsg,
        type: "danger"
      });
    }
  }

  public render() {

    if (this.props.loading) {
      return (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
          <Spinner color="red" />
        </View>
      );
    }

    return (
      <View style={{flex: 1}}>
        <ScrollView style={{backgroundColor: this.props.backgroundColor}}>
          {this.props.children}
        </ScrollView>
        {this.props.displayFooter && 
          <View style={styles.footer}>
            <TouchableHighlight>
              <View style={{flex: 0, alignItems: "center", alignContent: "center"}}>
                <Icon
                  name='user'
                  color='#000000'
                  size={30}
                />
                <Text>{strings.newsFooterLink}</Text>
              </View>
            </TouchableHighlight>
            <TouchableHighlight onPress={() => this.goToScreen("ChatList")}>
              <View style={{flex: 0, alignItems: "center", alignContent: "center"}}>
                <Icon
                  name='user'
                  color='#000000'
                  size={30}
                />
                <Text>{strings.messagingFooterLink}</Text>
              </View>
            </TouchableHighlight>
            <TouchableHighlight>
              <View style={{flex: 0, alignItems: "center", alignContent: "center"}}>
                <Icon
                  name='user'
                  color='#000000'
                  size={30}
                />
                <Text>{strings.deliveriesFooterLink}</Text>
              </View>
            </TouchableHighlight>
            <TouchableHighlight>
              <View style={{flex: 0, alignItems: "center", alignContent: "center"}}>
                <Icon
                  name='user'
                  color='#000000'
                  size={30}
                />
                <Text>{strings.contractsFooterLink}</Text>
              </View>
            </TouchableHighlight>
          </View>
        }
      </View>
    );
  }

  private goToScreen = (screen: string) => {
    this.props.navigation.navigate(screen);
  }
}
