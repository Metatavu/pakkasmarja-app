import React, { Dispatch } from "react";
import TopBar from "../../layout/TopBar";
import { Text } from "native-base";
import { View, TouchableOpacity } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { Contract, ItemGroup } from "pakkasmarja-client";
import { AccessToken, StoreState, ContractTableData } from "../../../types";
import { connect } from "react-redux";
import * as actions from "../../../actions";
import { styles } from "./styles";

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
    />
  };

  /**
   * Render rows
   */
  private renderRows = () => {
    const contractsNotTerminated = this.props.contractTableDatas.filter(contractTableData => contractTableData.contract.status !== "TERMINATED");
    
    return contractsNotTerminated.map((contractTableData) => {
      const contractStatus = contractTableData.contract.status;

      return (
        <TouchableOpacity key={contractTableData.contract.id} onPress={() => { this.props.onContractClick(contractTableData.contract) }}>
          {
            contractStatus !== "APPROVED" ? 
              this.renderNotApproved(contractStatus, contractTableData.itemGroup) :
              this.renderApproved(contractTableData.contract, contractTableData.itemGroup)
          }
        </TouchableOpacity>
      );
    });
  }

  /**
   * Render not apporoved row
   * 
   * @param contract contract
   * @param itemGroup itemGroup
   */
  private renderApproved = (contract: Contract, itemGroup?: ItemGroup) => {
    if (!contract || !contract.contractQuantity || !contract.deliveredQuantity) {
      return <Row></Row>;
    }

    return (
      <Row style={styles.row}>
        {this.renderColumn(itemGroup && itemGroup.displayName ? itemGroup.displayName : "-")}
        {this.renderColumn(contract.contractQuantity.toString()) }
        {this.renderColumn(contract.deliveredQuantity.toString()) }
      </Row>
    );
  }

  /**
   * Render not apporoved row
   * 
   * @param status status
   * @param itemGroup itemGroup
   */
  private renderNotApproved = (status: string, itemGroup?: ItemGroup) => {
    const infoText = this.getInfoTextByStatus(status);

    return (
      <Row style={styles.row}>
        {this.renderColumn(itemGroup && itemGroup.displayName ? itemGroup.displayName : "-")}
        {this.renderColumn(infoText)}
        {this.renderColumn("", {width: 1})}
      </Row>
    );
  }

  /**
   * Get info text by status
   * 
   * @param status status
   * @return info text
   */
  private getInfoTextByStatus = (status: string) => {
    switch (status) {
      case "ON_HOLD":
        return "Pakkasmarjan tarkistettavana";
      case "DRAFT":
        return "Tarkasta ehdotus";
      case "REJECTED":
        return "Hylätty";
      default:
        return "";
    }
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
    return (
      <View>
        <View style={styles.BlueContentView}>
          <Grid>
            <Row style={styles.headerRow}>
              <Col></Col>
              <Col><Text>Sovittu KG</Text></Col>
              <Col><Text>Toteutunut KG</Text></Col>
            </Row>
            {this.renderRows()}
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

