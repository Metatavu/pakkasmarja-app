import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import { Tabs, Tab, Thumbnail } from "native-base";
import { TouchableOpacity, Image, View, Text } from "react-native";
import { List, ListItem } from 'react-native-elements';
import { styles } from './styles.tsx'
import { PREDICTIONS_ICON, RED_LOGO, INCOMING_DELIVERIES_LOGO, COMPLETED_DELIVERIES_LOGO } from "../../../static/images";
import { Col, Row, Grid } from "react-native-easy-grid";

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
   * Render icon
   * 
   * @param src icon source
   */
  private renderIcon = (src: any) => {
    return (
      <Thumbnail 
        square 
        style={{ maxHeight: "100%", maxWidth: "100%" }} 
        source={src} 
      />
    );
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
            <Grid style={styles.listContainerStyle}>
              {
                deliveryList.map((listItem) => (
                  <Row style={{width: 40}}> 
                    <TouchableOpacity key={listItem.screen} onPress={() => { this.onDeliveryItemClick(listItem.screen, "FRESH") }}>
                      <Col>
                        <Image
                          source={listItem.icon}
                        />
                      </Col>
                      <Col>
                        <View style={styles.listItemContainerStyle}>
                          <Text>
                            {listItem.name}
                          </Text>
                        </View>
                      </Col>
                    </TouchableOpacity>
                  </Row>
                ))
              }
            </Grid>
          </Tab>
          <Tab activeTabStyle={{ ...styles.activeTab, ...styles.tab }} tabStyle={styles.tab} heading={"PAKASTEET"}>
            <Grid style={styles.listContainerStyle}>
              {
                deliveryList.map((listItem) => (
                  <Row style={{width: 40}}> 
                    <TouchableOpacity key={listItem.screen} onPress={() => { this.onDeliveryItemClick(listItem.screen, "FRESH") }}>
                      <Col>
                        <Image
                          source={listItem.icon}
                        />
                      </Col>
                      <Col>
                        <View style={styles.listItemContainerStyle}>
                          <Text>
                            {listItem.name}
                          </Text>
                        </View>
                      </Col>
                    </TouchableOpacity>
                  </Row>
                ))
              }
            </Grid>
          </Tab>
        </Tabs>
      </BasicScrollLayout>
    );
  }
}