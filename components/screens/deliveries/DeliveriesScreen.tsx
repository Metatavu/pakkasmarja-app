import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import { Tabs, Tab, Thumbnail } from "native-base";
import { TouchableOpacity } from "react-native";
import { List, ListItem } from 'react-native-elements';
import { styles } from './styles.tsx'
import { PREDICTIONS_ICON, RED_LOGO, INCOMING_DELIVERIES_LOGO, COMPLETED_DELIVERIES_LOGO } from "../../../static/images";

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
export default class DeliveriesScreen extends React.Component<Props, State> {

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
   * @param type type
   */
  private onDeliveryItemClick = (screen: string, type: string) => {
    this.props.navigation.navigate(screen, {
      type: type
    });
  }

  /**
   * Render method
   */
  public render() {
    const deliveryList = [{
      name: "Ehdotukset",
      icon: RED_LOGO,
      screen: "Suggestions"
    }, {
      name: "Viikkoennusteet",
      icon: PREDICTIONS_ICON,
      screen: "WeekDeliveryPrediction"
    }, {
      name: "Tulevat toimitukset",
      icon: INCOMING_DELIVERIES_LOGO,
      screen: "IncomingDeliveries"
    }, {
      name: "Tehdyt toimitukset",
      icon: COMPLETED_DELIVERIES_LOGO,
      screen: "PastDeliveries"
    }];

    return (

      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <Tabs>
          <Tab activeTabStyle={{ ...styles.activeTab, ...styles.tab }} tabStyle={styles.tab} heading={"TUORETUOTTEET"}>
            <List containerStyle={styles.listContainerStyle}>
              {
                deliveryList.map((listItem) => (
                  <TouchableOpacity key={listItem.screen} onPress={() => { this.onDeliveryItemClick(listItem.screen, "FRESH") }}>
                    <ListItem
                      key={listItem.name}
                      containerStyle={styles.listItemContainerStyle}
                      titleStyle={[styles.listItemTitle, {paddingLeft:10, color:"black"}]}
                      title={listItem.name}
                      leftIcon={<Thumbnail square small source={listItem.icon} />}
                    />
                  </TouchableOpacity>
                ))
              }
            </List>
          </Tab>
          <Tab activeTabStyle={{ ...styles.activeTab, ...styles.tab }} tabStyle={styles.tab} heading={"PAKASTEET"}>
            <List containerStyle={styles.listContainerStyle}>
              {
                deliveryList.map((listItem) => (
                  <TouchableOpacity key={listItem.screen} onPress={() => { this.onDeliveryItemClick(listItem.screen, "FROZEN") }}>
                    <ListItem
                      containerStyle={styles.listItemContainerStyle}
                      titleStyle={styles.listItemTitle}
                      key={listItem.name}
                      title={listItem.name}
                      leftIcon={{ type: 'font-awesome', name: 'truck', color: "red" }}
                    />
                  </TouchableOpacity>
                ))
              }
            </List>
          </Tab>
        </Tabs>
      </BasicScrollLayout>
    );
  }
}