import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./components/screens/LoginScreen";
import ContractsScreen from "./components/screens/contracts/ContractsScreen";
import ContractScreen from "./components/screens/contracts/ContractScreen";
import ContractTerms from "./components/screens/contracts/ContractTerms";
import NewsListScreen from "./components/screens/news/NewsListScreen";
import NewsArticleScreen from "./components/screens/news/NewsArticleScreen";
import { createStore } from "redux";
import { StoreState } from "./types";
import { AppAction } from "./actions";
import { reducer } from "./reducers";
import { Provider } from "react-redux";
import AuthRefresh from "./components/AuthRefresh";
import MqttConnector from "./components/MqttConnector";
import ChatsListScreen from "./components/screens/chats/ChatsListScreen";
import { Root } from "native-base";
import DeliveriesScreen from "./components/screens/deliveries/DeliveriesScreen";
import DeliveryScreen from "./components/screens/deliveries/DeliveryScreen";
import PastDeliveriesScreen from "./components/screens/deliveries/PastDeliveriesScreen";
import ViewAllDeliveriesScreen from "./components/screens/deliveries/ViewAllDeliveriesScreen";
import ProposalsScreen from "./components/screens/deliveries/ProposalsScreen";
import ProposalCheckScreen from "./components/screens/deliveries/ProposalCheckScreen";
import WeekDeliveryPredictionScreen from "./components/screens/deliveries/WeekDeliveryPredictionScreen";
import NewWeekDeliveryPrediction from "./components/screens/deliveries/NewWeekDeliveryPrediction";
import ViewWeekDeliveryPredictionScreen from "./components/screens/deliveries/ViewWeekDeliveryPredictionScreen"
import IncomingDeliveriesScreen from "./components/screens/deliveries/IncomingDeliveriesScreen";
import NewDelivery from "./components/screens/deliveries/NewDelivery";
import EditDelivery from "./components/screens/deliveries/EditDelivery";
import ManageContact from "./components/screens/contact/ManageContact";
import Permissions, { Permission, PERMISSIONS, PermissionStatus } from 'react-native-permissions';
import strings from "./localization/strings";
import ManageDeliveries from "./components/screens/ManageDeliveries/ManageDeliveries";
import ManageDelivery from "./components/screens/ManageDeliveries/ManageDelivery";
import DatabankScreen from "./components/screens/databank/DatabankScreen";
import ManageBoxDelivery from "./components/screens/ManageDeliveries/ManageBoxDelivery";
import { Platform } from "react-native";

interface State {
  authenticated: boolean
}

const initialStoreState: StoreState = {
  unreads: []
};

const store = createStore<StoreState, AppAction, any, any>(reducer as any, initialStoreState);

const RootStack = createStackNavigator();

export default class App extends React.Component<any, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      authenticated: false
    };

    strings.setLanguage("fi");

    if (Platform.OS === "android") {
      this.checkAndroidPermissions();
    }

    if (Platform.OS === "ios") {
      this.checkIosPermissions();
    }
  }

  /**
   * Checks permissions on iOS
   */
  private checkIosPermissions = async () => {
    await this.askPermissions([
      PERMISSIONS.IOS.CAMERA
    ]);
  }

  /**
   * Checks permissions on Android
   */
  private checkAndroidPermissions = async () => {
    await this.askPermissions([
      PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      PERMISSIONS.ANDROID.CAMERA
    ]);
  }

  /**
   * Asks given permissions
   *
   * @param permissions permissions to ask
   */
  private askPermissions = async (permissions: Permission[]): Promise<boolean> => {
    const availabilityResult = await Permissions.checkMultiple(permissions);

    const permissionStatuses: PermissionStatus[] = [];
    for (const permission of permissions) {
      if (availabilityResult[permission] !== "unavailable") {
        permissionStatuses.push(await Permissions.request(permission));
      }
    }

    return permissionStatuses.every(status => status === "granted");
  };

  /**
   * Component render method
   */
  render() {
    return (
      <Root>
        <Provider store={ store }>
          <MqttConnector>
            <NavigationContainer>
              <RootStack.Navigator
                initialRouteName="Login"
                screenOptions={{
                  headerStyle: {
                    backgroundColor: "#E51D2A",
                    height: 70
                  }
                }}
              >
                <RootStack.Screen name="Login" component={ LoginScreen } options={{ headerShown: false }}/>
                <RootStack.Screen name="ChatsList" component={ ChatsListScreen }/>
                <RootStack.Screen name="Contracts" component={ ContractsScreen }/>
                <RootStack.Screen name="Contract" component={ ContractScreen }/>
                <RootStack.Screen name="ContractTerms" component={ ContractTerms }/>
                <RootStack.Screen name="News" component={ NewsListScreen }/>
                <RootStack.Screen name="NewsArticle" component={ NewsArticleScreen }/>
                <RootStack.Screen name="Deliveries" component={ DeliveriesScreen }/>
                <RootStack.Screen name="ViewAllDeliveries" component={ ViewAllDeliveriesScreen }/>
                <RootStack.Screen name="Delivery" component={ DeliveryScreen }/>
                <RootStack.Screen name="PastDeliveries" component={ PastDeliveriesScreen }/>
                <RootStack.Screen name="Proposals" component={ ProposalsScreen }/>
                <RootStack.Screen name="ProposalCheck" component={ ProposalCheckScreen }/>
                <RootStack.Screen name="WeekDeliveryPrediction" component={ WeekDeliveryPredictionScreen }/>
                <RootStack.Screen name="NewWeekDeliveryPrediction" component={ NewWeekDeliveryPrediction }/>
                <RootStack.Screen name="ViewWeekDeliveryPrediction" component={ ViewWeekDeliveryPredictionScreen }/>
                <RootStack.Screen name="IncomingDeliveries" component={ IncomingDeliveriesScreen }/>
                <RootStack.Screen name="NewDelivery" component={ NewDelivery }/>
                <RootStack.Screen name="EditDelivery" component={ EditDelivery }/>
                <RootStack.Screen name="ManageContact" component={ ManageContact }/>
                <RootStack.Screen name="ManageDeliveries" component={ ManageDeliveries }/>
                <RootStack.Screen name="ManageDelivery" component={ ManageDelivery }/>
                <RootStack.Screen name="Databank" component={ DatabankScreen }/>
                <RootStack.Screen name="ManageBoxDelivery" component={ ManageBoxDelivery }/>
              </RootStack.Navigator>
            </NavigationContainer>
          </MqttConnector>
          <AuthRefresh/>
        </Provider>
      </Root>
    );
  }
}