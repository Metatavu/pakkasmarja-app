import React, { Dispatch } from "react";
import { Text } from "native-base";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import Modal from "react-native-modal";
import { Price } from "pakkasmarja-client";

/**
 * Interface for component props
 */
interface Props {
  modalOpen: boolean,
  prices?: Price[],
  closeModal: () => void,
  styles?: any
};

/**
 * Interface for component state
 */
interface State {
  modalOpen: boolean,
};

export default class ContractPriceModal extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      modalOpen: false
    };
  }

  /**
   * Close modal
   */
  private closeModal = () => {
    this.props.closeModal();
  }

  /**
   * Render method for contract modal component
   */
  public render() {
    const styles = StyleSheet.create({
      modalView: {
        backgroundColor:"white",
        height:470,
        padding: 15,
        marginBottom: 15
      },
      headerRow: {
        paddingBottom: 10,
        borderBottomColor: "#000000",
        borderBottomWidth: 1
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
      <View style={{ marginTop: 22 }}>
        <Modal isVisible={this.props.modalOpen}>
          <View style={styles.modalView}>
            <Grid>
              <Row style={styles.headerRow}>
                <Col><Text>Vuosi</Text></Col>
                <Col><Text>Hinta</Text></Col>
              </Row>
              {
                this.props.prices && this.props.prices.map((price) => {
                  return (
                    <Row key={price.id}>
                      <Col><Text>{price.year}</Text></Col>
                      <Col><Text>{`${price.price} ${price.unit}`}</Text></Col>
                    </Row>
                  );
                })
              }
            </Grid>
            <TouchableOpacity style={styles.bigRedButton} onPress={this.closeModal}>
              <Text style={styles.buttonText}>Sulje</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    );
  }
}