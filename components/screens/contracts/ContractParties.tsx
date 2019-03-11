import React from "react";
import { Contact } from "pakkasmarja-client";
import { Text } from "native-base";
import { View, StyleSheet } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";

/**
 * Interface for component props
 */
export interface Props {
  contact: Contact,
  companyName: string,
  companyBusinessId: string,
  styles?:any
};

/**
 * Interface for component state
 */
interface State {
};

export default class ContractParties extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
    };
  }

  /**
   * Format farmer party details text
   */
  private formatFarmerPartyDetails = () => {
    if (!this.props.contact) {
      return;
    }

    if (this.props.contact.companyName) {
      return this.props.contact.companyName;
    }

    return `${this.props.contact.firstName} ${this.props.contact.lastName}`;
  }

  /**
   * Render method for contract parties component
   */
  public render() {
    return (
      <View style={this.props.styles.WhiteContentView}>
        <Text style={this.props.styles.ContentHeader}>
          OSAPUOLET
        </Text>
        <Grid>
          <Row>
            <Col><Text style={this.props.styles.TextBold}>Viljelijä</Text></Col>
            <Col><Text style={this.props.styles.TextBold}>Yhtiö</Text></Col>
          </Row>
          <Row>
            <Col>
              <Text>{this.formatFarmerPartyDetails}</Text>
            </Col>
            <Col>
              <Text>{this.props.companyName}</Text>
              <Text>{this.props.companyBusinessId}</Text>
            </Col>
          </Row>
        </Grid>
      </View>
    );
  }
}