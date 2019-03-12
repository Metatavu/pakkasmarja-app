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
    const contractSignRequest = await contractsService.createContractDocumentSignRequest({ redirectUrl: "https://google.com" }, this.state.contract.id || "", '2019', this.state.ssn, this.state.selectedSignServiceId);
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
      WhiteContentView: {
        padding: 15,
        paddingBottom: 20,
      },
      Text: {
        fontSize: 20,
        paddingTop: 7,
        paddingBottom: 7
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
        height: 50,
        width: "100%",
        borderColor: "red",
        backgroundColor: "white",
        borderWidth: 2.5,
        borderRadius: 35,
        marginTop: 8,
        marginBottom: 15
      },
      textInput: {
        backgroundColor: "white",
        borderColor: "gray",
        borderWidth: 1,
        borderRadius: 4,
      },
      smallRedButton: {
        width: "45%",
        height: 50,
        backgroundColor: "#e01e36",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 5
      },
      buttonText: {
        color: "white",
        fontSize: 22,
        fontWeight: "500"
      },
      flexView: {
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        flexDirection: 'row',
      },
      linkStyle: {
        color: "blue",
        paddingTop: 4,
        paddingBottom: 4,
        marginBottom: 5,
        fontSize: 20
      }
    });

    return (
      <BasicLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View style={styles.WhiteContentView}>
          <View>
            <Text style={styles.ContentHeader}>
              Sopimus
            </Text>
            <Text style={styles.Text}>
              {`Satokautta ${this.state.contract ? this.state.contract.year : ""} koskeva sopimus`}
            </Text>
          </View>
          <View>
            <TouchableOpacity onPress={this.downloadContractPdfClicked}>
              <Text style={styles.linkStyle}>
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
            <Text style={[styles.Text, styles.TextBold]}>Tunnistautumispalvelu:</Text>
            <View style={{
              height: 50,
              width: "100%",
              backgroundColor: 'white',
              borderColor: "red",
              borderWidth: 2.5,
              borderRadius: 35
            }}>
              <Picker
                selectedValue={this.state.selectedSignServiceId}
                style={{height:50,width:"100%",color:"black"}}
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
          </View>
          <View>
            <Text style={[styles.Text, styles.TextBold]}>Henkilötunnus:</Text>
            <TextInput
              style={styles.InputStyle}
              value={this.state.ssn}
              onChangeText={(text: string) => this.setState({ ssn: text })}
            />
          </View>
          <View style={styles.flexView}>
            <TouchableOpacity style={[styles.smallRedButton, { marginRight: "5%" }]} onPress={this.backButtonClicked}>
              <Text style={styles.buttonText}>
                TAKAISIN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.smallRedButton, { marginLeft: "5%" }]} onPress={this.signContractClicked}>
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