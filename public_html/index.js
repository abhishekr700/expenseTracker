let selectedExpenseTypeId;
let selectedMonth;
let selectedYear;
let table;

// Returns date in YYYY-MM-DD
const getTodayDate = () => {
    let date = new Date();
    const offset = date.getTimezoneOffset();
    date = new Date(date.getTime() - (offset * 60 * 1000));
    const formattedDate = date.toISOString().split('T')[0];
    console.log(formattedDate);
    return {
        date: date.toISOString().split('T')[0],
        month: moment(date).format("MM"),
        year: moment(date).format("YYYY")
    };
};

const getCategories = async () => {
    const resp = await fetch("/expense/types");
    const jsonData = await resp.json();
    return jsonData;
};

/*
    Invokes getCategories() to get category data and populates the dropdown
    with category data
*/
const populateCategories = async () => {
    const typeDropdown = $("#expense-entry-type-dropdown");
    // const rhsDropdown
    const expenseTypes = await getCategories();
    for (const expenseType of expenseTypes) {
        typeDropdown.append(`<li><a class="dropdown-item" href="#" data-expensetype-id=${expenseType.id}>${expenseType.name}</a></li>`);
    }
};

// Setup the dropdown event listeners. Has to be run only once on page load.
const setupDropdowns = (month, year) => {
    // Populate the month/year dropdowns buttons with initial values.
    $("#expense-month-dropdown-btn").text(month);
    $("#expense-year-dropdown-btn").text(year);

    // Dropdown event listener for expense types
    $('#expense-entry-type-dropdown a').on('click', function () {
        const txt = ($(this).text());
        $("#expense-entry-type-dropdown-btn").text(txt);
        const id = $(this).attr('data-expensetype-id');
        selectedExpenseTypeId = id;
        console.log("Your Favourite Sports is " + txt + id);
    });

    // Dropdown event listener for month dropdown
    $('#expense-month-dropdown a').on('click', function () {
        const txt = ($(this).text());
        $("#expense-month-dropdown-btn").text(txt);
        const id = $(this).attr('data-month');
        selectedMonth = id;
        console.log("Month Selected:" + txt + id);
        updateExpense();
        populateFoodDeliveryTable()
    });

    // Dropdown event listener for year dropdown
    $('#expense-year-dropdown a').on('click', function () {
        const txt = ($(this).text());
        $("#expense-year-dropdown-btn").text(txt);
        const id = $(this).attr('data-year');
        selectedYear = id;
        console.log("Year Selected:" + txt + id);
        updateExpense();
        populateFoodDeliveryTable()
    });
};

const createTableRow = (expenseId, expenseDate, expenseName, expenseAmt, expenseTypeId, expenseTypeName) => {
    const formattedDate = moment(expenseDate, 'YYYY-MM-DD').format('MMMM D');
    // console.log({
    //     original: expenseDate,
    //     formattedDate
    // });
    // TODO: refactor to use the createTableRowCells() function
    const tableRow = `
        <tr id='row-${expenseId}' data-expense-id='${expenseId}'>
            <td data-date='${expenseDate}'>${formattedDate}</td>
            <td>${expenseName}</td>
            <td class="text-end">${expenseAmt}</td>
            <td data-expense-type-id='${expenseTypeId}'>${expenseTypeName}</td>
            <td><i class="fa fa-pencil-square" aria-hidden="true"></td>
        </tr>
        `;
    return tableRow;
};

// Create HTML for cells within a table row
const createTableRowCells = (expenseDate, expenseName, expenseAmt, expenseTypeId, expenseTypeName) => {
    const formattedDate = moment(expenseDate, 'YYYY-MM-DD').format('MMMM D');
    // console.log({
    //     original: expenseDate,
    //     formattedDate
    // });
    const tableRow = `
            <td data-date='${expenseDate}'>${formattedDate}</td>
            <td>${expenseName}</td>
            <td class="text-end">${expenseAmt}</td>
            <td data-expense-type-id='${expenseTypeId}'>${expenseTypeName}</td>
            <td><i class="fa fa-pencil-square" aria-hidden="true"></td>
        `;
    return tableRow;
};

// Populates the table with id tableId with data from tableData
const populateTable = async (tableId, tableData) => {
    console.log("populateTable()");
    // Hack: Destroy the datatable to recreate it using the fresh DOM data later.
    // More explanation in comment down below.
    if (table) {
        table.destroy()
    }

    const total = tableData.total;
    const expenseList = tableData.expenseEntries;

    const allExpTable = $(`#${tableId}`);
    const tableBody = allExpTable.children("tbody").first();

    console.log({
        table: allExpTable,
        tableBody: tableBody
    });
    // Clear old data
    tableBody.html('');


    const tableRow = `
        <tr>
            <td></td>
            <td>Total</td>
            <td class="text-end">${total}</td>
            <td></td>
            <td></td>
        </tr>
        `;
    tableBody.append(tableRow);

    // table.row.add(["1", "2", "3", "4", "5"]).draw()

    for (const expense of expenseList) {
        tableBody.append(createTableRow(expense.id, expense.date, expense.name, expense.amount, expense.ExpenseTypes[0].id, expense.ExpenseTypes[0].name));
        // table.row.add([expense.date, expense.name, expense.amount, expense.ExpenseTypes[0].name, `<i class="fa fa-pencil-square" aria-hidden="true">`]).draw()
    }

    // Recreate the datatable so that it picks up the updated row data.
    // Note: This is a hacky way to do this ie to delete (table.destroy() invoked above) and recreate the datatable.
    // Ideally, we should use the datatables api to update the new row data, but that would require
    // significant refactoring due to the usage of buttons in last column, data attributes etc
    // So until I have the time & patience to do that refactoring, this is what I'm gonna commit.
    table = $('#all-expense-table').DataTable({
        "columnDefs": [
            { orderable: false, targets: 0 }
        ],
        "order": [],
        "pageLength": 100
        // stateSave: true
    });
};

const populateFoodDeliveryTable = async () => {
    const foodDeliveryTableId = "food-delivery-expense-table";
    const resp = await fetch("/expenseMonthly?" + new URLSearchParams({
        month: selectedMonth,
        year: selectedYear,
        expenseTypes: 3
    }));
    const jsonResp = await resp.json();
    await populateTable(foodDeliveryTableId, jsonResp);
};

// Updates the expenses into the table.
const updateExpense = async () => {
    if (selectedMonth === undefined || selectedYear === undefined) {
        console.log(`One of month/year selections is undefined. ${selectedMonth}-${selectedYear}`);
        return;
    }
    console.log(`Fetching expenses: ${selectedMonth}-${selectedYear}`);
    const resp = await fetch("/expenseMonthly?" + new URLSearchParams({
        month: selectedMonth,
        year: selectedYear,
    }));
    const jsonResp = await resp.json();
    console.log(jsonResp);
    await populateTable("all-expense-table", jsonResp);
};


window.onload = async () => {
    const IDs = {
        expenseEntryDatePicker: "expense-entry-dates"
    };
    const datePicker = $("#expense-entry-date");
    const typeDropdown = $("#expense-entry-type-dropdown");
    const expenseNameField = $("#expense-entry-name");
    const expenseAmtField = $("#expense-entry-amt");

    const { date, month, year } = getTodayDate();

    // Set some defaults
    selectedMonth = month;
    selectedYear = year;
    console.log({
        date, month, year
    });
    datePicker.val(date);

    // table = $('#all-expense-table').DataTable({
    //     "columnDefs": [
    //         { orderable: false, targets: 0 }
    //     ],
    //     "order": [],
    //     "pageLength": 100,
    //     createdRow: (row, data) => {
    //         // $(row).attr('data-expense-id', data.id);
    //         console.log("CreatedRow !", data);
    //     }
    //     // stateSave: true
    // });


    // Handle click on Add Expense button
    $("#expense-entry-submit-btn").on('click', async () => {
        const name = expenseNameField.val();
        const amt = expenseAmtField.val();
        const date = datePicker.val();
        console.log({
            name, amt, date, selectedExpenseTypeId
        });
        if (name === '' || amt === '' || selectedExpenseTypeId === undefined) {
            console.log("Invalid Data");
            return;
        }
        const rawResponse = await fetch('/expenseEntry', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, amount: amt, date, typeId: selectedExpenseTypeId })
        });
        const content = await rawResponse.json();

        expenseNameField.val('');
        expenseAmtField.val('');

        console.log(content);
        await updateExpense();
        await populateFoodDeliveryTable();

        $('all-expense-table').DataTable();
    });

    await populateCategories();
    /* Make sure populateCategories() is invoked before you setup dropdowns as
       event listeners are attached to <a> tags added by populateCategories()
    */
    setupDropdowns(month, year);


    await updateExpense();

    // TODO: turn it on later
    await populateFoodDeliveryTable()

    // table.order.neutral().draw();

    // Handle Edit Expense Button
    $("#all-expense-table").on("click", "i.fa.fa-pencil-square", async (e) => {
        console.log("Click", e.target, this);
        $(e.target).removeClass().addClass("fa fa-envelope-o");
        const row = $(e.target).closest("tr").off("mousedown");
        // Select all cells except the last one (which has the edit/save btn)
        const cells = row.find("td").not(':last');

        const nameCell = cells[1];
        const expenseAmtCell = cells[2];
        const expenseDateCell = cells[0];
        const expenseCategoryCell = cells[3];

        // Collect old data of cells
        const nameCellData = $(nameCell).text();
        const expenseAmtCellData = $(expenseAmtCell).text();
        const expenseDateCellData = $(expenseDateCell).data('date');
        const expenseCategoryId = $(expenseCategoryCell).data('expense-type-id');

        // Make cells editable with default value as their existing value
        $(nameCell).html(`<input type='text' value='${nameCellData}'>`);
        $(expenseAmtCell).html(`<input type='number' value='${expenseAmtCellData}'>`);
        $(expenseDateCell).html(`<input type='date' value='${expenseDateCellData}'>`);

        // Expense Category Dropdown
        const categoryData = await getCategories();
        let dropdownOptionsHtml = "";
        categoryData.forEach(e => {
            if (e.id == expenseCategoryId) {
                dropdownOptionsHtml += `<option value="${e.id}" selected>${e.name}</option>`;
            } else {
                dropdownOptionsHtml += `<option value="${e.id}">${e.name}</option>`;
            }
        });
        $(expenseCategoryCell).html(`
            <select name="dog-names" id="dog-names">
            ${dropdownOptionsHtml}
            </select>
        `);
    });

    // Handle save button post expense edit
    $("#all-expense-table").on("click", "i.fa.fa-envelope-o", async (e) => {
        console.log("Expense save button clicked:", e.target);

        $(e.target).removeClass().addClass("fa fa-pencil-square");
        const row = $(e.target).closest("tr").off("mousedown");
        const rowId = row.attr('id')
        const expenseId = row.data('expense-id')
        console.log("row:", row, rowId);
        const inputFields = row.find("input");
        const typeDropdown = row.find("select")[0];

        const nameCell = inputFields[1];
        const expenseAmtCell = inputFields[2];
        const expenseDateCell = inputFields[0];
        const expenseCategoryCell = inputFields[3];

        // Collect old data of cells
        const nameCellData = $(nameCell).val();
        const expenseAmtCellData = $(expenseAmtCell).val();
        const expenseDateCellData = $(expenseDateCell).val();
        const expenseCategoryId = $(typeDropdown).find(":selected").val();
        const expenseTypeName = $(typeDropdown).find(":selected").text();

        console.log("PostEditData:", {
            nameCellData, expenseAmtCellData, expenseDateCellData, expenseCategoryId
        });

        // Make PATCH request to update the database
        const rawResponse = await fetch('/expenseEntry', {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ expenseId: expenseId, name: nameCellData, amount: expenseAmtCellData, date: expenseDateCellData, typeId: expenseCategoryId })
        });
        const patchResp = await rawResponse.json();
        console.log("Update resp:", patchResp);

        const updatedExpense = patchResp

        // Update the table with latest data
        const tableRowHtml = createTableRowCells(updatedExpense.date, updatedExpense.name, updatedExpense.amount, updatedExpense.ExpenseTypes[0].id, updatedExpense.ExpenseTypes[0].name)
        row.html(tableRowHtml)
        table.draw()
        // setTimeout(() => table.draw(), 3000)

    });
};
