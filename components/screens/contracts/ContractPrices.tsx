import React from "react";
import { Text, List, ListItem } from "native-base";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { ItemGroup, ItemGroupPrice } from "pakkasmarja-client";
import ContractPriceModal from "./ContractPriceModal";
import { styles } from "./styles";
import strings from "../../../localization/strings";

/**
 * Interface for component props
 */
interface Props {
  itemGroup: ItemGroup,
  prices?: ItemGroupPrice[],
  styles?: any
};

/**
 * Interface for component state
 */
interface State {
  showPastPrices: boolean
};

/**
 * Contract prices component class
 */
export default class ContractPrices extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      showPastPrices: false,
    };
  }

  /**
   * Format prices text
   */
  private renderPricesText = () => {
    if (!this.props.itemGroup) {
      return <Text></Text>;
    }
    return (
      <Text style={styles.textSize}>
        {`Ostettavien marjojen (${this.props.itemGroup.displayName}) takuuhinnat satokaudella ${new Date().getFullYear()}`}
      </Text>
    );
  }

  /**
   * Get item details
   */
  private renderItemDetails = () => {
    if (!this.props.itemGroup) {
      return <View></View>;
    }

    switch (this.props.itemGroup.name) {
      case "304100/Mansikka":
      case "309100/Luomu mansikk":
        return (
            <Text style={{ fontSize: 18 }}>
              Takuuhinnan lisäksi yhtiö maksaa viljelijälle bonusta sopimuksen täyttöasteen mukaisesti.
              Lisätietoja sopimuksen kohdasta Sopimuksen mukaiset toimitusmäärät, takuuhinnat ja bonus satokaudella 2020. Sopimusmäärän ylittävältä osalta mahdollinen lisämäärä, mahdollinen bonus ja maksuehto neuvotellaan aina erikseen.
              Kaikki hinnat ovat vähimmäishintoja ja ALV 0%. Toimitusehto on vapaasti yhtiön osoittaman pakastevaraston laiturilla (viljelijä maksaa rahdin). Yhtiöllä on oikeus markkinatilanteen vaatiessa korottaa hintoja haluamallaan tavalla.
              Takuuhinnan maksuehto on viljely- ja ostosopimuksen mukainen. Bonukset tarkistetaan satokauden jälkeen, yhtiö tekee niistä ostolaskut bonukseen oikeutetuille viljelijöille ja ne pyritään maksamaan satovuoden joulukuussa. Bonusta ei makseta, jos sopimus on tehty 5.6. jälkeen.
            </Text>
        );
      case "304400/Mustaherukka":
      case "309300/Luomu mustahe":
        return (
            <Text style={{ fontSize: 18 }}>
              Tarkistathan sopimusehdoista kohdasta Sopimuksen mukainen toimitusmäärä ja takuuhinta satokaudella muut hintaan vaikuttavat tekijät.
              Sopimusmäärän ylittävältä osalta mahdollinen lisämäärä, hinta ja maksuehto neuvotellaan aina erikseen.
              Kaikki hinnat ovat vähimmäishintoja ja ALV 0%. Toimitusehto on vapaasti yhtiön osoittaman pakastevaraston laiturilla (viljelijä maksaa rahdin). Yhtiöllä on oikeus markkinatilanteen vaatiessa korottaa hintoja haluamallaan tavalla.
              Takuuhinnan maksuehto on viljely- ja ostosopimuksen mukainen.
            </Text>
        );
      default:
        return (
            <Text style={{ fontSize: 18 }}>
              Sopimusmäärän ylittävältä osalta mahdollinen lisämäärä, hinta ja maksuehto neuvotellaan aina erikseen.
              Kaikki hinnat ovat vähimmäishintoja ja ALV 0%. Toimitusehto on vapaasti yhtiön osoittaman pakastevaraston laiturilla (viljelijä maksaa rahdin). Yhtiöllä on oikeus markkinatilanteen vaatiessa korottaa hintoja haluamallaan tavalla.
              Takuuhinnan maksuehto on viljely- ja ostosopimuksen mukainen.
            </Text>
        );
    }
  }

  /**
   * Render method
   */
  public render() {
    if (this.props.itemGroup && this.props.itemGroup.category === "FROZEN") {
      return (
        <View style={styles.WhiteContentView}>
          <Text style={styles.ContentHeader}>
            TAKUUHINNAT
          </Text>
          <View style={{flex:1}}>
            {this.renderPricesText()}
          </View>
          <Grid>
            {
              this.props.prices && this.props.prices.filter(price => price.year === new Date().getFullYear()).map((activePrice) => {
                return (
                  <Row key={activePrice.id}>
                    <Col><Text>{activePrice.group}</Text></Col>
                    <Col><Text>{`${activePrice.price} ${activePrice.unit}`}</Text></Col>
                  </Row>
                );
              })
            }
            <Row>
              <Col>
                <TouchableOpacity onPress={() => this.setState({showPastPrices: !this.state.showPastPrices})}>
                  <Text style={styles.linkStyle}>
                    Edellisvuosien takuuhinnat
                  </Text>
                </TouchableOpacity>
              </Col>
            </Row>
            {
              this.props.prices && this.state.showPastPrices && this.props.prices.filter(price => price.year !== new Date().getFullYear()).map((activePrice) => {
                return (
                  <Row key={activePrice.id}>
                    <Col><Text>{activePrice.group}</Text></Col>
                    <Col><Text>{`${activePrice.price} ${activePrice.unit}`}</Text></Col>
                  </Row>
                );
              })
            }
          </Grid>
          <ContractPriceModal 
            prices={this.props.prices}
            styles={styles} 
            closeModal={() => this.setState({showPastPrices: false})} 
            modalOpen={this.state.showPastPrices}
          />
          {this.renderItemDetails()}
        </View>
      );
    }
    return (
      <View style={ styles.WhiteContentView }>
        <Text style={ styles.ContentHeader }>Tuoremarjojen hinnottelu</Text>
        <Text>{ strings.contractDetailsReadFromContract }</Text>
      </View>
    );

  }
}
