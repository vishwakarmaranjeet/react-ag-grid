import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import { FakeServer } from "./fakeServer.jsx";

const CustomCellRenderer = p => {
    const onPrint = useCallback(() => window.alert(p.value));
    return (
        <>
            <button onClick={onPrint} style={{ marginRight: "10px" }}>{p.buttonText}</button>
            <span>{p.value}sss</span>
        </>
    )
};

const Push = p => {
    const onPrint = useCallback(() => window.alert(p.value));
    return (
        <><button onClick={onPrint}>Add</button> {p.value}</>
    )
}
const AgGrid = () => {
    const gridRef = useRef();
    const [gridApi, setGridApi] = useState(null);
    console.log("GRID REF", gridApi);
    const [colDefs, setColDefs] = useState([]);

    useEffect(() => {
        const fetchColumnDefs = async () => {
            try {
                const response = await fetch("http://localhost:3000/columnDefinition.json");
                const data = await response.json();
                // Dynamically register custom cell renderers
                const componentMap = {
                    CustomCellRenderer,
                    Push
                };
                const comparatorMap = {
                    numericComparator: (valueA, valueB) => {
                        return valueA - valueB;  // Numeric sorting
                    },
                    stringComparator: (valueA, valueB) => {
                        return valueA.localeCompare(valueB);  // String sorting
                    }
                };
                // Role-based logic: Viewer should not see "gold" column
                const userRole = "viewer";
                const updatedColDefs = data.map(group => ({
                    ...group,

                    children: group.children
                        // Filter or hide logic for columns
                        .filter(child => {
                            if (userRole === "viewer" && child.field === "goldd") return false; // Remove 'gold' for viewers
                            return true;
                        })
                        .map(child => ({
                            ...child,
                            cellRenderer: typeof child.cellRenderer === "string" && componentMap[child.cellRenderer]
                                ? componentMap[child.cellRenderer]
                                : child.cellRenderer,
                            // Map comparator dynamically
                            comparator: typeof child.comparator === "string" && comparatorMap[child.comparator]
                                ? comparatorMap[child.comparator]
                                : child.comparator
                        }))
                }));
                setColDefs(updatedColDefs);
            } catch (error) {
                console.error("Error loading column definition", error);
            }
        }

        fetchColumnDefs();
    }, []);
    const defaultColDef = useMemo(() => {
        return {
            filter: true,
            sortable: true,
        }
    });

    // Create the server-side data source
    // const getServerSideDatasource = () => {
    //     return {
    //         getRows: (params) => {
    //             // Fetch data from JSONPlaceholder with pagination and sorting
    //             fetch(`https://www.ag-grid.com/example-assets/olympic-winners.json`)
    //                 .then((response) => response.json())
    //                 .then((data) => {
    //                     if (!Array.isArray(data)) {
    //                         console.error('Data is not an array:', data);
    //                         params.fail(); // Stop loading if data is not valid
    //                         return;
    //                     }
    //                     params.success({ rowData: data, rowCount: data.length }); // Static total row count
    //                 })
    //                 .catch((error) => {
    //                     console.error("ERROR", error);
    //                     params.fail(); // Use failCallback for errors
    //                 });
    //         }
    //     };
    // };

    const getServerSideDatasource = (server) => {
        return {
            getRows: (params) => {
                console.log("[Datasource] - rows requested by grid: ", params.request);
                var response = server.getData(params.request);
                // adding delay to simulate real server call
                setTimeout(() => {
                    if (response.success) {
                        // call the success callback
                        params.success({
                            rowData: response.rows,
                            rowCount: response.lastRow,
                        });
                    } else {
                        // inform the grid request failed
                        params.fail();
                    }
                }, 200);
            },
        };
    };

    // When grid is ready, set the server-side data source
    const onGridReady = (params) => {
        if (params?.api) {
            setGridApi(params?.api);
        }
        fetch("https://www.ag-grid.com/example-assets/olympic-winners.json")
            .then((resp) => resp.json())
            .then((data) => {
                // add id to data
                var idSequence = 1;
                data.forEach(function (item) {
                    item.id = idSequence++;
                });
                // setup the fake server with entire dataset
                var fakeServer = new FakeServer(data);
                // create datasource with a reference to the fake server
                var datasource = getServerSideDatasource(fakeServer);
                // register the datasource with the grid
                params.api.setGridOption("serverSideDatasource", datasource);
            });
    };

    const saveColumnState = useCallback(() => {
        if (gridApi) {
            const columnState = gridApi?.getColumnState();
            localStorage.setItem("columnState", JSON.stringify(columnState));
        }
    }, [gridApi]);

    useEffect(() => {
        const columnState = localStorage.getItem("columnState");
        const columnDef = JSON.parse(columnState);
        if (gridApi) {
            gridApi.applyColumnState({
                state: columnDef,
                sort: null,
                applyWidths: true,
                applyOrder: true
            });
        }
    }, [gridApi]);

    const resetColumnState = () => {
        const columnState = localStorage.getItem("resetColumnState");
        const columnDef = JSON.parse(columnState);
        if (gridApi) {
            gridApi.applyColumnState({
                state: columnDef,
                sort: null,
                applyWidths: true,
                applyOrder: true
            });
        }
    }
    const onColumnMoved = useCallback(() => {
        saveColumnState();
    }, [saveColumnState]);

    const onColumnResized = useCallback(() => {
        saveColumnState();
    }, [saveColumnState]);

    const onColumnVisible = useCallback(() => {
        saveColumnState();
    }, [saveColumnState]);

    const getRowId = (params) => `${params.data.id}`;
    return (
        <div>
            <button onClick={resetColumnState}>Reset Column</button>
            <div className="ag-theme-alpine" style={{ height: 500, width: "100%" }}>
                <AgGridReact
                    ref={gridRef}
                    columnDefs={colDefs}
                    defaultColDef={defaultColDef}
                    pagination={true}
                    rowModelType="serverSide"
                    suppressRowClickSelection={true} // ✅ Prevent row click from selecting
                    rowSelection="multiple" // ✅ Multiple row selection enabled
                    maintainColumnOrder
                    onGridReady={onGridReady}
                    onColumnMoved={onColumnMoved}
                    onColumnResized={onColumnResized}
                    onColumnVisible={onColumnVisible}
                    getRowId={getRowId}
                />
            </div>
        </div>
    )
};
export default AgGrid;