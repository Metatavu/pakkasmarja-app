import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicLayout from "../../layout/BasicLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, ContractModel } from "../../../types";
import * as actions from "../../../actions";
import { Text } from "native-base";
import { View, TouchableHighlight, StyleSheet } from "react-native";
//import Api from "../../../api";
import { Col, Row, Grid } from "react-native-easy-grid";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import { Contract, Contact, Address, Price, ItemGroup } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";


export interface Props {
  contracts: Contract[],
  onContractClick: (contract: Contract) => void;
};

interface State {
};

export default class ContractAmountTable extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      tableData: []
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

  render() {
    const styles = StyleSheet.create({
      BlueContentView: {
        padding: 15,
        backgroundColor: "#dae7fa",
        paddingBottom: 20,
        marginBottom: 15
      },
      headerRow:{
        paddingBottom: 5, 
        marginBottom:20,
        borderBottomColor: "#000000", 
        borderBottomWidth: 1
      },
      row:{
        paddingBottom: 12, 
        paddingTop: 12, 
      }
    });
    return (
      <View style={styles.BlueContentView}>
            <Grid style={{ padding: 10 }}>
              <Row style={styles.headerRow}>
                <Col></Col>
                <Col><Text>Sovittu KG</Text></Col>
                <Col><Text>Toteutunut KG</Text></Col>
              </Row>
              {this.props.contracts.filter(contract => contract.status !== "TERMINATED").map((contract) => {
                return (
                  <TouchableHighlight key={contract.id} onPress={() => { this.props.onContractClick(contract) }}>
                    <Row style={styles.row}>
                      <Col><Text style={{ fontSize: 20, fontWeight:"bold" }}>Mustikka</Text></Col>
                      <Col><Text style={{ fontSize: 20 }}>{contract.contractQuantity}</Text></Col>
                      <Col><Text style={{ fontSize: 20 }}>{contract.deliveredQuantity}</Text></Col>
                    </Row>
                  </TouchableHighlight>
                );
              })}
            </Grid>
      </View>
    );
  }
}

