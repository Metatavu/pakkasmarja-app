import React from "react";
import { Text } from "native-base";
import { View, TouchableOpacity } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import Modal from "react-native-modal";
import { ItemGroupPrice } from "pakkasmarja-client";
import { styles  } from "./styles";

/**
 * Interface for component props
 */
interface Props {
  modalOpen: boolean,
  prices?: ItemGroupPrice[],
  closeModal: () => void,
  styles?: any
};

/**
 * Interface for component state
 */
interface State {
  modalOpen: boolean,
};

/**
 * Contract price modal component class
 */
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