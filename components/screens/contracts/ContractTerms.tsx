import React, { Dispatch } from "react";
import PakkasmarjaApi from "../../../api";
import { AccessToken, StoreState } from "../../../types";
import { Text } from "native-base";
import { View, TouchableOpacity, Picker, TextInput, StyleSheet } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { CheckBox } from "react-native-elements";
import { SignAuthenticationService, Contract } from "pakkasmarja-client";
import * as actions from "../../../actions";
import { connect } from "react-redux";
import BasicLayout from "../../layout/BasicLayout";
import TopBar from "../../layout/TopBar";
import { REACT_APP_API_URL } from 'react-native-dotenv';

/**
 * Interface for component props
 */
interface Props {
  navigation?: any
  accessToken?: AccessToken
};

/**
 * Interface for component state
 */
interface State {
  authServices?: SignAuthenticationService[],
  contract?: Contract,
  styles?: any,
  acceptedTerms: boolean,
  viableToSign: boolean,
  selectedSignServiceId: string,
  ssn: string
};

class ContractTerms extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      acceptedTerms: false,
      viableToSign: false,
      selectedSignServiceId: "0",
      ssn: ""
    };
  }

  /**
   * Component did mount
   */
  public componentDidMount = async () => {
    if (!this.props.accessToken) {
      return;
    }

    if (this.props.navigation.getParam('contract')) {
      console.log(this.props.navigation.getParam('contract'));
      this.setState({ contract: this.props.navigation.getParam('contract') });
    }

    const api = new PakkasmarjaApi(`${REACT_APP_API_URL}/rest/v1`);
    const signAuthenticationServicesService = api.getSignAuthenticationServicesService(this.props.accessToken.access_token);
    const signAuthenticationServices = await signAuthenticationServicesService.listSignAuthenticationServices();
    this.setState({ authServices: signAuthenticationServices });
  }

  /**
   * Download contract as pdf
   */
  private downloadContractPdfClicked = async () => {

  }

  /**
   * Accept contract
   */
  private signContractClicked = async () => {
    if (!this.props.accessToken || !this.state.contract) {
      return;
    }

    console.log(this.state.ssn);
    console.log(this.state.selectedSignServiceId);
    const api = new PakkasmarjaApi(`${REACT_APP_API_URL}/rest/v1`);
    const contractsService = api.getContractsService(this.props.accessToken.access_token);
    const contractSignRequest = await contractsService.createContractDocumentSignRequest({redirectUrl: "https://google.com"}, this.state.contract.id || "", '2019', this.state.ssn, this.state.selectedSignServiceId);
    console.log(contractSignRequest);
  }

  /**
   * Accept contract
   */
  private backButtonClicked = async () => {

  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
      secondaryNavItems={[{
        "text": "Secondary 1",
        "link": "/secondary"
      }, {
        "text": "Secondary 2",
        "link": "/secondary"
      }, {
        "text": "Secondary 3",
        "link": "/secondary"
      }]}
    />
  };

  /**
   * Render method for contract modal component
   */
  public render() {
    const styles = StyleSheet.create({
      BlueContentView: {
        padding: 15,
        backgroundColor: "#dae7fa",
        paddingTop: 35,
        paddingBottom: 20,
        marginBottom: 15
      },
      WhiteContentView: {
        padding: 15,
        paddingBottom: 20,
      },
      readingText:{
        fontSize: 20
      },
      TextBold: {
        fontWeight: "bold"
      },
      ContentHeader: {
        fontWeight: "bold",
        fontSize: 25,
        paddingBottom: 20
      },
      InputStyle: {
        height: 40,
        width: "100%",
        borderColor: "red",
        backgroundColor: "white",
        borderWidth: 2.5,
        borderRadius: 30,
        marginTop: 8,
        marginBottom: 8,
        marginLeft:0
      },
      textWithSpace:{
        paddingTop:7,
        paddingBottom:7
      },
      textInput:{
        backgroundColor:"white",
        borderColor: "gray",
        borderWidth: 1,
        borderRadius: 4,
      },
      bigRedButton: {
        width: "100%",
        height: 45,
        backgroundColor: "#e01e36",
        justifyContent: "center",
        alignItems: "center",
        marginBottom:10
      },
      buttonText:{
        color:"white",
        fontSize:22,
        fontWeight: "500"
      }
    });

    return (
      <BasicLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View>
          <View>
            <Text>
              Sopimus
            </Text>
            <Text>
              {`Satokautta ${this.state.contract ? this.state.contract.year : ""} koskeva sopimus`}
            </Text>
          </View>
          <View>
            <TouchableOpacity style={styles.bigRedButton} onPress={this.downloadContractPdfClicked}>
              <Text style={styles.buttonText}>
                Lataa sopimus PDF - muodossa.
                </Text>
            </TouchableOpacity>
          </View>
          <View>
            <CheckBox
              checked={this.state.acceptedTerms}
              onPress={() => this.setState({ acceptedTerms: !this.state.acceptedTerms })}
              title='Olen lukenut ja hyväksyn sopimusehdot'
            />
            <CheckBox
              checked={this.state.viableToSign}
              onPress={() => this.setState({ viableToSign: !this.state.viableToSign })}
              title='Olen viljelijän puolesta edustuskelpoinen'
            />
          </View>
          <View>
            <Picker
              selectedValue={this.state.selectedSignServiceId}
              style={{height: 50, width: "100%", backgroundColor:"white"}}
              onValueChange={(itemValue) =>
                this.setState({ selectedSignServiceId: itemValue })
              }>
              {
                this.state.authServices && this.state.authServices.map((authService) => {
                  return (
                    <Picker.Item key={authService.identifier} label={authService.name || ""} value={authService.identifier} />
                  );
                })
              }
            </Picker>
          </View>
          <View>
            <Text>Henkilötunnus</Text>
            <TextInput 
              value={this.state.ssn}
              onChangeText={(text: string) => this.setState({ ssn: text })}
            />
          </View>
          <View>
            <TouchableOpacity style={[styles.bigRedButton, { marginLeft: "5%" }]} onPress={this.backButtonClicked}>
              <Text style={styles.buttonText}>
                TAKAISIN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bigRedButton} onPress={this.signContractClicked}>
              <Text style={styles.buttonText}>
                ALLEKIRJOITA
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BasicLayout>
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

export default connect(mapStateToProps, mapDispatchToProps)(ContractTerms);