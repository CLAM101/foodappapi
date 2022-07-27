import React, {useState, useEffect} from 'react'
import axios from "axios";
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';


// componenet built to display a table of all a restaurants active orders
function ActiveOrderTable(newOrder) {
    const [activeOrders,
        setActiveOrders] = useState([
        {
            id: "",
            status: "",
            total: "",
            orderData: "",
            items: []
        }
    ])

    //will run on first render and thereafter if the newOrder dependancy changes, the dependacy will change when a new order comes in
    useEffect(() => {
        let mounted = true

        getActiveOrders()

        // hist endpoint on backend and gets all active orders of the logged in restaurant
        async function getActiveOrders() {
            if (mounted) {
                console.log("is mounted")

                await axios({method: "GET", withCredentials: true, url: "http://localhost:3000/restaurants/getactiveorders"}).then((response) => {
                    if (response.status === 200) {
                        console.log("response on get", response.data)

                        updateActiveOrders(response.data)

                    } else {
                        return false;
                    }
                })
            }
        }
        try {
            // console.log(activeOrders)
        } catch (e) {
            console.log(e)
        }

    }, [newOrder]);


 // updates Active orders state with active orders retrieved from backend
    function updateActiveOrders(data) {
        setActiveOrders(data)
    }

    // function for when a restaurant wants to change the status of one of their active orders onClick client will hit an endpoint on the backend which will change the order status from "prep" to "ready for collection"
    async function handleItemClick(item) {

        console.log("handle click item", item)

        const orderId = item._id

        console.log("orderID", orderId)

        await axios({
            method: "POST",
            data: {
                order: orderId
            },
            withCredentials: true,
            url: "http://localhost:3000/restaurants/rest-adj-order-status"
        }).then((response) => {
            if (response.status === 200) {
                console.log("response on get", response.data)

                alert("order" + {
                    orderId
                } + "status changed")

            } else {
                return false;
            }
        })

    }

    console.log("active Orders", activeOrders)


    // maps all items in the retieved activeOrders array and maps them to a material ui table, will first check if array is undefined, this helps avoid an error on fuirst render
    if (activeOrders !== undefined) {
        return (

            <TableContainer
                actions={[{
                    icon: "save",
                    tooltip: "save User"
                }
            ]}
                component={Paper}>
                <Table
                    sx={{
                    minWidth: 650
                }}
                    aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Actions</TableCell>
                            <TableCell>ID</TableCell>
                            <TableCell align="right">Status</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="right">Items</TableCell>
                            <TableCell align="right">Order Data</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {activeOrders.map((row, i) => (
                            <TableRow
                                key={i}
                                sx={{
                                '&:last-child td, &:last-child th': {
                                    border: 0
                                }
                            }}>
                                <TableCell component="th" scope="row">
                                    <button onClick ={() => handleItemClick(row)}>Ready for collect</button>
                                </TableCell>
                                <TableCell component="th" scope="row">
                                    {row._id}
                                </TableCell>
                                <TableCell align="right">{row.status}</TableCell>
                                <TableCell align="right">{row.total}</TableCell>
                                <TableCell align="right">{JSON.stringify(row.items.name)}</TableCell>
                                <TableCell align="right">{row.orderData}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }

}

export default ActiveOrderTable