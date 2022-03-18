import React from "react";
import { Contact } from "pakkasmarja-client";
import { Text } from "native-base";
import { View } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { styles } from "./styles";

/**
 * Interface for component props
 */
interface Props {
  contact: Contact,
  companyName: string,
  companyBusinessId: string
};

/**
 * Interface for component state
 */
interface State {
};

/**
 * Contract parties component class
 */
export default class ContractParties extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  /**
   * Format farmer party details text
   */
  private renderFarmerPartyDetails = () => {
    if (!this.props.contact) {
      return <Text></Text>;
    }

    if (this.props.contact.companyName) {
      return (
        <Text style={styles.textSize}>
          {this.props.contact.companyName}
        </Text>
      );
    }

    return (
      <Text style={styles.textSize}>
        {`${this.props.contact.firstName} ${this.props.contact.lastName}`}
      </Text>
    );
  }

  /**
   * Render method for contract parties component
   */
  public render() {
    return (
      <View style={styles.WhiteContentView}>
        <Text style={styles.ContentHeader}>
          OSAPUOLET
        </Text>
        <Grid>
          <Row>
            <Col><Text style={[styles.TextBold, styles.textSize]}>Viljelijä</Text></Col>
            <Col><Text style={[styles.TextBold, styles.textSize]}>Yhtiö</Text></Col>
          </Row>
          <Row>
            <Col>
              {this.renderFarmerPartyDetails()}
            </Col>
            <Col>
              <Text style={styles.textSize}>{this.props.companyName}</Text>
              <Text style={styles.textSize}>{this.props.companyBusinessId}</Text>
            </Col>
          </Row>
        </Grid>
      </View>
    );
  }
}