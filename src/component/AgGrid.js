import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css";
import "ag-grid-enterprise";

const CustomCellRenderer = p => {
    const onPrint = useCallback(() => window.alert(p.value));
    return (
        <>
            <button onClick={onPrint} style={{ marginRight: "10px" }}>{p.buttonText}</button>
            <span>{p.value}</span>
        </>
    )
};

const Push = p => {
    const onPrint = useCallback(() => window.alert(p.value));
    return (
        <><button onClick={onPrint}>Push</button>{p.value}</>
    )
}
const AgGrid = () => {
    const gridRef = useRef();
    console.log(gridRef);
    const defaultColDef = useMemo(() => {
        return {
            // flex: 1,
            filter: true,
            sortable: true,
            enableRowGroup: true
        }
    });
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([
        {
            field: "athlete",
            lockPosition: true,
            cellClassRules: { "green": p => p.value },
            cellRenderer: CustomCellRenderer,
            pinned: "left",
            cellRendererParams: {
                buttonText: "@"
            },
        },
        { field: "age" },
        { field: "country" },
        { field: "year" },
        { field: "date" },
        { field: "sport" },
        {
            field: "gold",
            cellRendererSelector: p => {
                console.log("selector", p);
                if (p.value == 2) {
                    return { component: Push }
                }
                if (p.value == 3) {
                    return <p>Cancel</p>
                }
            }
        },
        { field: "silver" },
        { field: "bronze" },
        { field: "total" }
    ]);

    useEffect(() => {
        fetch("https://www.ag-grid.com/example-assets/olympic-winners.json")
            .then(result => result.json())
            .then(rowData => setRowData(rowData));
    }, []);

    return (
        <div className="ag-theme-quartz" style={{ height: 500, width: "80%" }}>
            <AgGridReact
                rowGroupPanelShow="always"
                ref={gridRef}
                rowData={rowData}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
            />
        </div>
    )
};
export default AgGrid;