import * as React from "react";
// import styles from "./OrgChart.module.scss";
import { IOrgChartProps } from "./IOrgChartProps";
import { escape } from "@microsoft/sp-lodash-subset";
import MainComponent from "./MainComponent";
import { sp } from "@pnp/sp";

export default class OrgChart extends React.Component<IOrgChartProps, {}> {
  constructor(prop: IOrgChartProps, state: {}) {
    super(prop);
    sp.setup({
      spfxContext: this.props.context,
    });
  }
  public render(): React.ReactElement<IOrgChartProps> {
    return <MainComponent context={this.props.context} />;
  }
}
