import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, WeekDeliveryPredictionTableData } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { styles } from "./styles.tsx";
import { ItemGroup } from "pakkasmarja-client";
import { Icon } from "native-base";
import NumericInput from 'react-native-numeric-input';

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
};

/**
 * Component state
 */
interface State {
  averageDailyAmount: number;
  percentageAmount: number;

  predictionData?: WeekDeliveryPredictionTableData;
};

/**
 * View week delivery prediction component class
 */
class ViewWeekDeliveryPredictionScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      averageDailyAmount: 0,
      percentageAmount: 0,
    };
  }

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }
    const predictionData: WeekDeliveryPredictionTableData = await this.props.navigation.getParam('predictionData');
    const averageDailyAmount: number = Math.round(predictionData.weekDeliveryPrediction.amount / 9);
    this.setState({ predictionData: predictionData, averageDailyAmount: averageDailyAmount });

  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
    />
  };

  /**
   * Render method
   */
  public render() {
    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View style={styles.center}>
          <Text style={{ fontWeight: "bold", fontSize: 24, color: "black", padding: 20 }}>{this.state.predictionData ? this.state.predictionData.itemGroup.displayName : null}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={[styles.center, styles.lightRedBackGroundColor, { paddingVertical: 10 }]}>
            <TouchableOpacity>
              <Text style={styles.red}>Katso kaikki toimitukset</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 2, borderBottomColor: "black", borderBottomWidth: 0.7, paddingVertical: 20 }}>
          <View style={[styles.center, { paddingBottom: 20 }]}>
            <Text style={{ fontSize: 24, color: "black", fontWeight: "500" }}>Ennuste viikolle {this.state.predictionData ? this.state.predictionData.weekDeliveryPrediction.weekNumber : null} (KG)</Text>
          </View>
          <View style={styles.center}>
            <View style={[styles.center, { width: 370, height: 70, borderRadius: 7, borderColor: "#e01e36", borderWidth: 1.25, marginBottom: 10 }]}>
              <NumericInput
                initValue={this.state.predictionData ? this.state.predictionData.weekDeliveryPrediction.amount : 0}
                onChange={() => { }}
                totalWidth={360}
                totalHeight={50}
                editable={false}
                iconSize={35}
                step={0}
                valueType='real'
                minValue={0}
                textColor='black'
                iconStyle={{ color: 'white' }}
                rightButtonBackgroundColor='#e01e36'
                leftButtonBackgroundColor='#e01e36'
                borderColor='transparent'
                rounded
              />
            </View>
          </View>
          <View style={styles.center}>
            <Text style={styles.textPrediction}>Keskimäärin<Text style={[styles.textPrediction, { fontWeight: "bold" }]}>{` ${this.state.averageDailyAmount} kg/pv`}</Text></Text>
            <Text style={styles.textPrediction}>Muutos viime viikkoon <Text style={[styles.textPrediction, { fontWeight: "bold" }]}>{` ${this.state.percentageAmount} %`}</Text></Text>
          </View>
        </View>
        <View style={[styles.center, { paddingVertical: 20 }]}>
          <Text style={{ fontSize: 22, color: "black", fontWeight: "500" }}>Minä päivinä toimitat?</Text>
          <View style={[styles.center, { paddingVertical: 20 }]}>
            {
              Object.entries(this.state.predictionData ? this.state.predictionData.weekDeliveryPrediction.days : {}).map((key) => {
                return this.RadioButton(key.slice()[1], key.slice()[0]);
              })
            }
          </View>
        </View>
        <View style={styles.center}>
          <TouchableOpacity style={[styles.deliveriesButton, { width: "70%", height: 60, marginTop: 10, marginBottom: 20 }]} onPress={() => { this.props.navigation.navigate("WeekDeliveryPrediction") }}>
            <Text style={styles.buttonText}>Takaisin</Text>
          </TouchableOpacity>
        </View>
      </BasicScrollLayout>
    );
  }

  /**
   * Renders one radio button
   */
  private RadioButton = (selected: boolean, label: string) => {

    return (
      <View key={label} style={{ flex: 1, flexDirection: "row", marginVertical: 5 }}>
        <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "flex-end", paddingVertical: 5 }}>
          <View style={{ flex: 1 }}>
            <View style={{
              height: 26,
              width: 26,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#e01e36',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {
                selected ?
                  <View style={{
                    height: 12,
                    width: 12,
                    borderRadius: 6,
                    backgroundColor: '#e01e36',
                  }} />
                  : null
              }
            </View>
          </View>
        </View>
        <View style={{ flex: 1.5, justifyContent: "flex-start", alignItems: "flex-start" }}>
          <Text style={[styles.textPrediction, { paddingLeft: 15, paddingVertical: 5 }]}>{label}</Text>
        </View>
      </View>
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

export default connect(mapStateToProps, mapDispatchToProps)(ViewWeekDeliveryPredictionScreen);
