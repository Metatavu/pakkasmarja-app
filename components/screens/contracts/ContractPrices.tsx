import React from "react";
import { Text, List, ListItem } from "native-base";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { ItemGroup, Price } from "pakkasmarja-client";

/**
 * Interface for component props
 */
interface Props {
  itemGroup: ItemGroup,
  prices?: Price[],
  styles?: any
};

/**
 * Interface for component state
 */
interface State {
  showPastPrices: boolean
};

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
   * Toggle display of past prices
   */
  private togglePastPrices = () => {
    if (this.state.showPastPrices) {
      this.setState({ showPastPrices: false });
    } else {
      this.setState({ showPastPrices: true });
    }
  }

  /**
   * Format prices text
   */
  private renderPricesText = () => {
    if (!this.props.itemGroup) {
      return <Text></Text>;
    }
    return (
      <Text>
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
          <View>
            <Text style={{ marginTop: 1, marginBottom: 1 }}>Takuuhinnan lisäksi yhtiö maksaa viljelijälle bonusta sopimuksen täyttöasteen mukaisesti. Lisätietoja sopimuksen kohdasta Sopimuksen mukaiset toimitusmäärät, takuuhinnat ja bonus satokaudella 2018.</Text>
            <Text style={{ marginTop: 1, marginBottom: 1 }}>Sopimusmäärän ylittävältä osalta mahdollinen lisämäärä, mahdollinen bonus ja maksuehto neuvotellaan aina erikseen.</Text>
            <Text style={{ marginTop: 1, marginBottom: 1 }}>Kaikki hinnat ovat vähimmäishintoja ja ALV 0%. Toimitusehto on vapaasti yhtiön osoittaman pakastevaraston laiturilla (viljelijä maksaa rahdin). Yhtiöllä on oikeus markkinatilanteen vaatiessa korottaa hintoja haluamallaan tavalla.</Text>
            <Text style={{ marginTop: 1, marginBottom: 1 }}>Takuuhinnan maksuehto on viljely- ja ostosopimuksen mukainen. Bonukset tarkistetaan satokauden jälkeen, yhtiö tekee niistä ostolaskut bonukseen oikeutetuille viljelijöille ja ne pyritään maksamaan satovuoden joulukuussa. Bonusta ei makseta, jos sopimus on tehty 31.5. jälkeen.</Text>
          </View>
        );
      case "304400/Mustaherukka":
      case "309300/Luomu mustahe":
        return (
          <View>
            <Text style={{ marginTop: 1, marginBottom: 1 }}>Tarkistathan sopimusehdoista kohdasta Sopimuksen mukainen toimitusmäärä ja takuuhinta satokaudella muut hintaan vaikuttavat tekijät.</Text>
            <Text style={{ marginTop: 1, marginBottom: 1 }}>Sopimusmäärän ylittävältä osalta mahdollinen lisämäärä, hinta ja maksuehto neuvotellaan aina erikseen.</Text>
            <Text style={{ marginTop: 1, marginBottom: 1 }}>Kaikki hinnat ovat vähimmäishintoja ja ALV 0%. Toimitusehto on vapaasti yhtiön osoittaman pakastevaraston laiturilla (viljelijä maksaa rahdin). Yhtiöllä on oikeus markkinatilanteen vaatiessa korottaa hintoja haluamallaan tavalla.</Text>
            <Text style={{ marginTop: 1, marginBottom: 1 }}>Takuuhinnan maksuehto on viljely- ja ostosopimuksen mukainen.</Text>
          </View>
        );
      default:
        return (
          <View>
            <Text style={{ marginTop: 1, marginBottom: 1 }}>Sopimusmäärän ylittävältä osalta mahdollinen lisämäärä, hinta ja maksuehto neuvotellaan aina erikseen.</Text>
            <Text style={{ marginTop: 1, marginBottom: 1 }}>Kaikki hinnat ovat vähimmäishintoja ja ALV 0%. Toimitusehto on vapaasti yhtiön osoittaman pakastevaraston laiturilla (viljelijä maksaa rahdin). Yhtiöllä on oikeus markkinatilanteen vaatiessa korottaa hintoja haluamallaan tavalla.</Text>
            <Text style={{ marginTop: 1, marginBottom: 1 }}>Takuuhinnan maksuehto on viljely- ja ostosopimuksen mukainen.</Text>
          </View>
        );
    }
  }

  /**
   * Render method
   */
  public render() {
    const styles = StyleSheet.create({
      listItem:{
        paddingLeft:0,
        marginLeft:0
      }
    });
    if (this.props.itemGroup && this.props.itemGroup.category === "FROZEN") {
      return (
        <View style={this.props.styles.WhiteContentView}>
          <Text style={this.props.styles.ContentHeader}>
            Takuuhinnat
          </Text>
            {this.renderPricesText()}
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
                <TouchableOpacity onPress={this.togglePastPrices}>
                  <Text style={{ textDecorationLine: "underline", color: "blue" }}>
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
          {this.renderItemDetails()}
        </View>
      );
    }
    return (
      <View style={this.props.styles.WhiteContentView}>
        <Text style={this.props.styles.ContentHeader}>Tuotemarjojen hinnottelu</Text>
        <List>
          <ListItem style={styles.listItem}><Text> Vähimmäislaatuvaatimukset täyttävästä tuoremarjasta yhtiö maksaa päivän hinnan.</Text></ListItem>
          <ListItem style={styles.listItem}><Text> Yhtiö voi huomioida max. 0,20 eur Alv 0%/ kg -suuruisella bonuksella BONUS-laatuiset marjat.</Text></ListItem>
          <ListItem style={styles.listItem}><Text> Tunneli-/ kasvihuonetuotannosta ostettavalle marjalle pyritään maksamaan korkeampi päivän hinta.</Text></ListItem>
          <ListItem style={styles.listItem}><Text> Jos marjaerä ei täytä yhtiön vähimmäislaatuvaatimuksia neuvotellaan erän hinnasta aina erikseen viljelijän kanssa.</Text></ListItem>
          <ListItem style={styles.listItem}><Text> Yhtiö voi myös maksaa kyseisellä viikolla toimittaneille viljelijöille lisäbonuksen hyvin onnistuneen sopimusyhteistyön johdosta.</Text></ListItem>
        </List>
      </View>
    );

  }
}