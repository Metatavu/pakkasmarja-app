import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, ContractTableData } from "../../../types";
import * as actions from "../../../actions";
import { Text } from "native-base";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { Contract } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import { styles } from "../contracts/styles";
import { List, ListItem } from 'react-native-elements';

/**
 * Component props
 */
interface Props {
  navigation: any,
  accessToken?: AccessToken
};

/**
 * Component state
 */
interface State {
  loading: boolean
};

/**
 * Deliveries screen component class
 */
class DeliveriesScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false
    };
  }

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }
  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
    />
  };

  /**
   * On delivery item click
   * 
   * @param screen screen
   */
  private onDeliveryItemClick = (screen: string) => {
    this.props.navigation.navigate(screen, {
    });
  }

  /**
   * Render method
   */
  public render() {
    if (this.state.loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }

    const deliveryList = [{
      name: "Ehdotukset",
      avatar_url: "https://s3.amazonaws.com/uifaces/faces/twitter/ladylexy/128.jpg",
      screen: "Suggestions"
    }, {
      name: "Viikkoennusteet",
      avatar_url: "https://s3.amazonaws.com/uifaces/faces/twitter/ladylexy/128.jpg",
      screen: "WeeklyEstimations"
    }, {
      name: "Tulevat toimitukset",
      avatar_url: "https://s3.amazonaws.com/uifaces/faces/twitter/ladylexy/128.jpg",
      screen: "IncomingDeliveries"
    }, {
      name: "Tehdyt toimitukset",
      avatar_url: "https://s3.amazonaws.com/uifaces/faces/twitter/ladylexy/128.jpg",
      screen: "PastDeliveries"
    }];

    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <List containerStyle={{marginBottom: 20}}>
        {
          deliveryList.map((listItem) => (
            <TouchableOpacity key={listItem.screen} onPress={() => { this.onDeliveryItemClick(listItem.screen) }}>
              <ListItem
                roundAvatar
                avatar={{uri:listItem.avatar_url}}
                key={listItem.name}
                title={listItem.name}
              />
            </TouchableOpacity>
          ))
        }
      </List>
      </BasicScrollLayout>
    );
  }
}

/**
 * Redux mapper for mapping store state to component props
 * 
 * @param state store state
 */
function mapStateToProps(state: StoreState) {
  return {
    accessToken: state.accessToken
  };
}

/**
 * Redux mapper for mapping component dispatches 
 * 
 * @param dispatch dispatch method
 */
function mapDispatchToProps(dispatch: Dispatch<actions.AppAction>) {
  return {
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DeliveriesScreen);
