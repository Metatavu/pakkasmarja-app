import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { styles } from "./styles.tsx";
import { WeekDeliveryPrediction, ItemGroup } from "pakkasmarja-client";
import { Icon } from "native-base";
import NumericInput from 'react-native-numeric-input';
import moment from "moment";
import PakkasmarjaApi from "../../../api";

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
  loading: boolean;
  itemGroups: ItemGroup[];
  selectedItemGroup: ItemGroup;
  itemGroupIndex: number;
  amount: number;
  weekDays: { name: string, value: boolean }[];
  lastWeeksDeliveryPredictionTotalAmount: number;
  averageDailyAmount: number;
  percentageAmount: number;
};

/**
 * New week delivery prediction component class
 */
class NewWeekDeliveryPrediction extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      itemGroups: [],
      lastWeeksDeliveryPredictionTotalAmount: 0,
      itemGroupIndex: 0,
      averageDailyAmount: 0,
      percentageAmount: 0,
      amount: 0,
      selectedItemGroup: {},
      weekDays: [
        { name: "monday", value: false },
        { name: "tuesday", value: false },
        { name: "wednesday", value: false },
        { name: "thursday", value: false },
        { name: "friday", value: false },
        { name: "saturday", value: false },
        { name: "sunday", value: false },
      ]
    };
  }

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }

    await this.setLastWeeksTotal();
    const itemGroups: ItemGroup[] = await this.props.navigation.getParam('itemGroups');
    this.setState({ itemGroups: itemGroups, selectedItemGroup: itemGroups[0] });

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
    if (this.state.loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }
    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View style={{ flex: 1, flexDirection: "row", padding: 15 }}>
          <View style={styles.center}>
            <TouchableOpacity onPress={() => { this.changeItemGroup("minus") }} >
              <Icon style={styles.red} type="Entypo" name="chevron-left"></Icon>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 8, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontWeight: "bold", fontSize: 24, color: "black" }}>{this.state.selectedItemGroup.displayName}</Text>
          </View>
          <TouchableOpacity onPress={() => { this.changeItemGroup("add") }} >
            <Icon style={styles.red} type="Entypo" name="chevron-right"></Icon>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, marginBottom: 1 }}>
          <View style={[styles.lightRedBackGroundColor, { flex: 1, flexDirection: "row", paddingVertical: 10 }]}>
            <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start", paddingLeft: 20 }}>
              <Text style={styles.textPrediction}>Viime viikon toimitukset</Text>
            </View>
            <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "flex-end", paddingRight: 20 }} >
              <Text style={[styles.textPrediction, { fontWeight: "bold" }]}>{`${this.state.lastWeeksDeliveryPredictionTotalAmount} kg`}</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={[styles.center, styles.lightRedBackGroundColor, { paddingVertical: 10 }]}>
            <TouchableOpacity>
              <Text style={styles.red}>Katso kaikki toimitukset</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 2, borderBottomColor: "black", borderBottomWidth: 0.7, paddingVertical: 20 }}>
          <View style={[styles.center, { paddingTop: 25, paddingBottom: 20 }]}>
            <Text style={{ fontSize: 24, color: "black", fontWeight: "500" }}>Ennuste ensi viikolle (KG)</Text>
          </View>
          <View style={styles.center}>
            <View style={[styles.center, { width: 370, height: 70, borderRadius: 7, borderColor: "#e01e36", borderWidth: 1.25, marginBottom: 10 }]}>
              <NumericInput
                value={this.state.amount}
                initValue={this.state.amount}
                onChange={(value: number) => this.handleValueChange(value)}
                totalWidth={360}
                totalHeight={50}
                iconSize={35}
                step={100}
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
              this.state.weekDays.map((day, index) => {
                return (
                  this.RadioButton(day.value, day.name, index)
                );
              })

            }
          </View>
        </View>
        <View style={styles.center}>
          <TouchableOpacity style={[styles.deliveriesButton, { width: "70%", height: 60, marginTop: 10, marginBottom: 20 }]} onPress={() => { this.sendNewWeekDeliveryPrediction() }}>
            <Text style={styles.buttonText}>Lähetä viikkoennuste</Text>
          </TouchableOpacity>
        </View>
      </BasicScrollLayout>
    );
  }

  /**
   * Renders one radio button
   */
  private RadioButton = (selected: boolean, label: string, index: number) => {
    return (
      <View key={label} style={{ flex: 1, flexDirection: "row", marginVertical: 5 }}>
        <TouchableOpacity style={{ flex: 1, justifyContent: "flex-end", alignItems: "flex-end", paddingVertical: 5 }} onPress={() => {
          this.changeWeekDayValue(selected, index);
        }}>
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
        </TouchableOpacity>
        <View style={{ flex: 1.5, justifyContent: "flex-start", alignItems: "flex-start" }}>
          <Text style={[styles.textPrediction, { paddingLeft: 15, paddingVertical: 5 }]}>{label}</Text>
        </View>
      </View>
    );
  }

  /**
   * Sends new week delivery prediction
   */
  private sendNewWeekDeliveryPrediction = async () => {
    if (!this.props.accessToken) {
      return;
    }

    const weekDeliveryPredictionDays: any = {};
    this.state.weekDays.forEach((day) => {
      weekDeliveryPredictionDays[day.name] = day.value;
    });
    if (this.state.selectedItemGroup.id) {
      const weekDeliveryPrediction: WeekDeliveryPrediction = {
        itemGroupId: "A", // this.state.selectedItemGroup.id  ei ole oikea, tietokannassa on externalId? ja itemgroup.id on jotakin muuta
        userId: this.props.accessToken.userId,
        amount: this.state.amount,
        weekNumber: this.getWeekNumber(),
        year: this.getYear(),
        days: weekDeliveryPredictionDays
      }
      const Api = new PakkasmarjaApi();
      const weekDeliveryPredictionService = await Api.getWeekDeliveryPredictionsService(this.props.accessToken.access_token);
      await weekDeliveryPredictionService.createWeekDeliveryPrediction(weekDeliveryPrediction);
      this.props.navigation.navigate("Deliveries");
    }
  }

  /**
   * Handle value change
   */
  private handleValueChange = (value: number) => {
    const averageDailyAmount: number = Math.round(value / 9);
    const percentageAmount: number = this.state.lastWeeksDeliveryPredictionTotalAmount / value; // täää pitää tehhä
    this.setState({ amount: value, averageDailyAmount: averageDailyAmount, percentageAmount: percentageAmount });
  }

  /**
   * Set last weeks total to state
   */
  private setLastWeeksTotal = async () => {
    if (!this.props.accessToken) {
      return;
    }
    const lastWeekNumber: number = this.getWeekNumber() - 1 == -1 ? 52 : this.getWeekNumber() - 1;
    const Api = new PakkasmarjaApi();
    const weekDeliveryPredictionService = await Api.getWeekDeliveryPredictionsService(this.props.accessToken.access_token);
    const filteredByWeekNumber = await weekDeliveryPredictionService.listWeekDeliveryPredictions(undefined, undefined, undefined, lastWeekNumber);
    filteredByWeekNumber.forEach(async (weekDeliveryPrediction) => {
      const amount: number = await weekDeliveryPrediction.amount;
      let totalAmount = this.state.lastWeeksDeliveryPredictionTotalAmount + amount;
      this.setState({ lastWeeksDeliveryPredictionTotalAmount: totalAmount });
    });
  }

  /**
   * Get week number
   */
  private getWeekNumber = () => {
    const date: Date = new Date();
    return Number(moment(date).format("W"));
  }

  /**
   * Get year
   */
  private getYear = () => {
    const date: Date = new Date();
    return moment(date).year();
  }

  /**
   * Changes value of radio buttons
   */
  private changeWeekDayValue = (selected: boolean, index: number) => {
    let weekDays = [...this.state.weekDays];
    let day = { ...weekDays[index] }
    day.value = !selected;
    weekDays[index] = day
    this.setState({ weekDays });
  }

  /**
   * Changes item group
   */
  private changeItemGroup = (action: string) => {
    const maxValue: number = this.state.itemGroups.length - 1;
    const minValue: number = 0;
    let value: number = this.state.itemGroupIndex;
    if (action === "add" && value !== maxValue) {
      value++;
      this.setState({ itemGroupIndex: value });
    }
    if (action === "minus" && value !== minValue) {
      value--;
      this.setState({ itemGroupIndex: value });
    }
    this.setState({ selectedItemGroup: this.state.itemGroups[value] });
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

export default connect(mapStateToProps, mapDispatchToProps)(NewWeekDeliveryPrediction);
