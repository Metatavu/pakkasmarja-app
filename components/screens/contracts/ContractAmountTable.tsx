import React, { Dispatch } from "react";
import TopBar from "../../layout/TopBar";
import { Text } from "native-base";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { Contract } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import { AccessToken, StoreState, ContractTableData } from "../../../types";
import { connect } from "react-redux";
import * as actions from "../../../actions";
import { REACT_APP_API_URL } from 'react-native-dotenv';

/**
 * Component props
 */
interface Props {
  contractTableDatas: ContractTableData[];
  onContractClick: (contract: Contract) => void;
  type: string;
  onProposeNewContractClick: (type: string) => void;
  accessToken?: AccessToken;
};

/**
 * Component state
 */
interface State {
};

class ContractAmountTable extends React.Component<Props, State> {

  /**
   * Constructor 
   * 
   * @param props 
   */
  constructor(props: Props) {
    super(props);
    this.state = {
    };
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
   * Get item group 
   * 
   * @param itemGroupId itemGroupId
   */
  private getItemGroup = async (itemGroupId: any) => {
    if (!this.props.accessToken) {
      return;
    }

    const api = new PakkasmarjaApi(`${REACT_APP_API_URL}/rest/v1`);
    const itemGroupService = api.getItemGroupsService(this.props.accessToken.access_token);
    return await itemGroupService.findItemGroup(itemGroupId);
  }

  /**
   * Render column
   * 
   * @param text
   * @style style
   */
  private renderColumn = (text: string, style?: any) => {
    return (
      <Col style={style}>
        <Text style={{ fontSize: 20 }}>
          {text}
        </Text>
      </Col> 
    );
  }

  /**
   * Render method
   */
  public render() {
    const styles = StyleSheet.create({
      BlueContentView: {
        padding: 15,
        backgroundColor: "#dae7fa",
        paddingBottom: 20,
        marginBottom: 15
      },
      WhiteContentView: {
        padding: 15,
        paddingBottom: 20,
      },
      headerRow: {
        paddingBottom: 5,
        marginBottom: 20,
        borderBottomColor: "#000000",
        borderBottomWidth: 1
      },
      row: {
        paddingBottom: 12,
        paddingTop: 12,
      },
      bigRedButton: {
        width: "100%",
        height: 45,
        backgroundColor: "#e01e36",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10
      },
      buttonText: {
        color: "white",
        fontSize: 22,
        fontWeight: "500"
      }
    });
    return (
      <View>
        <View style={styles.BlueContentView}>
          <Grid>
            <Row style={styles.headerRow}>
              <Col></Col>
              <Col><Text>Sovittu KG</Text></Col>
              <Col><Text>Toteutunut KG</Text></Col>
            </Row>
            {
              this.props.contractTableDatas.filter(contractTableData => contractTableData.contract.status !== "TERMINATED").map((contractTableData) => {
                return (
                  <TouchableOpacity key={contractTableData.contract.id} onPress={() => { this.props.onContractClick(contractTableData.contract) }}>
                    <Row style={styles.row}>
                      {
                        this.renderColumn(contractTableData.itemGroup && contractTableData.itemGroup.displayName ? contractTableData.itemGroup.displayName : "-")
                      }
                      {
                        contractTableData.contract.status !== "APPROVED" && contractTableData.contract.status === "ON_HOLD" &&
                          this.renderColumn("Pakkasmarjan tarkistettavana")
                      }
                      {
                        contractTableData.contract.status !== "APPROVED" && contractTableData.contract.status === "DRAFT" &&
                          this.renderColumn("Tarkasta ehdotus")
                      }
                      {
                        contractTableData.contract.status !== "APPROVED" && contractTableData.contract.status === "REJECTED" &&
                          this.renderColumn("Hylätty")
                      }
                      {
                        contractTableData.contract.status !== "APPROVED" &&
                          this.renderColumn("", {width: 1})
                      }
                      { 
                        contractTableData.contract.status === "APPROVED" &&  contractTableData.contract.contractQuantity &&
                          this.renderColumn(contractTableData.contract.contractQuantity.toString()) 
                      }
                      { 
                        contractTableData.contract.status === "APPROVED" &&  contractTableData.contract.deliveredQuantity &&
                          this.renderColumn(contractTableData.contract.deliveredQuantity.toString())
                      }
                    </Row>
                  </TouchableOpacity>
                );
              })}
          </Grid>
        </View>
        <View style={styles.WhiteContentView}>
          <TouchableOpacity style={styles.bigRedButton} onPress={() => this.props.onProposeNewContractClick(this.props.type)}>
            <Text style={styles.buttonText}>
              {
                this.props.type === "FROZEN" ? "Ehdota uutta pakastesopimusta" : "Ehdota uutta tuoresopimusta"
              }
            </Text>
          </TouchableOpacity>
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

export default connect(mapStateToProps, mapDispatchToProps)(ContractAmountTable);

