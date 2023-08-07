let selectedExpenseTypeId;

const getTodayDate = () => {
    let date = new Date();
    const offset = date.getTimezoneOffset();
    date = new Date(date.getTime() - (offset * 60 * 1000));
    return date.toISOString().split('T')[0];
};

const getCategories = async () => {
    const resp = await fetch("/expenseTypes");
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

    $('#expense-entry-type-dropdown a').on('click', function () {
        const txt = ($(this).text());
        $("#expense-entry-type-dropdown-btn").text(txt)
        const id = $(this).attr('data-expensetype-id');
        selectedExpenseTypeId = id;
        console.log("Your Favourite Sports is " + txt + id);
    });
}

const populateTable = async (tableId, tableData) => {
    const total = tableData.total
    const expenseList = tableData.expenseEntries;

    const allExpTable = $(`#${tableId}`);
    const tableBody = allExpTable.children("tbody").first()

    console.log({
        table: allExpTable,
        tableBody: tableBody
    });

    tableBody.html('')


    let tableRow = `
        <tr>
            <td></td>
            <td>Total</td>
            <td class="text-end">${total}</td>
            <td></td>
        </tr>
        `
    tableBody.append(tableRow)

    for (const expense of expenseList) {
        const formattedDate = moment(expense.date, 'YYYY-MM-DD').format('MMMM D');
        console.log({
            original: expense.date,
            formattedDate
        });
        let tableRow = `
        <tr>
            <td>${formattedDate}</td>
            <td>${expense.name}</td>
            <td class="text-end">${expense.amount}</td>
            <td>${expense.ExpenseTypes[0].name}</td>
        </tr>
        `
        tableBody.append(tableRow)
    }
}

const populateFoodDeliveryTable = async () => {
    const foodDeliveryTableId = "food-delivery-expense-table"
    let resp = await fetch("/expenseMonthly?" + new URLSearchParams({
        month: 8,
        year: 2023,
        expenseTypes: 3
    }))
    const jsonResp = await resp.json();
    await populateTable(foodDeliveryTableId, jsonResp)
}

const updateExpense = async () => {
    let resp = await fetch("/expenseMonthly?" + new URLSearchParams({
        month: 8,
        year: 2023,
    }))
    const jsonResp = await resp.json();
    console.log(jsonResp);
    const expenseList = jsonResp.expenseEntries;
    const total = jsonResp.total
    const allExpTable = $("#all-expense-table-body");
    allExpTable.html('')

    let tableRow = `
        <tr>
            <td></td>
            <td>Total</td>
            <td class="text-end">${total}</td>
            <td></td>
        </tr>
        `
    allExpTable.append(tableRow)

    for (const expense of expenseList) {
        const formattedDate = moment(expense.date, 'YYYY-MM-DD').format('MMMM D');
        console.log({
            original: expense.date,
            formattedDate
        });
        let tableRow = `
        <tr>
            <td>${formattedDate}</td>
            <td>${expense.name}</td>
            <td class="text-end">${expense.amount}</td>
            <td>${expense.ExpenseTypes[0].name}</td>
        </tr>
        `
        allExpTable.append(tableRow)
    }
}


window.onload = async () => {
    const IDs = {
        expenseEntryDatePicker: "expense-entry-dates"
    };
    const datePicker = $("#expense-entry-date");
    const typeDropdown = $("#expense-entry-type-dropdown");
    const expenseNameField = $("#expense-entry-name");
    const expenseAmtField = $("#expense-entry-amt");

    // Set some defaults
    datePicker.val(getTodayDate());

    // Handle click on Add Expense button
    $("#expense-entry-submit-btn").on('click', async () => {
        const name = expenseNameField.val();
        const amt = expenseAmtField.val();
        const date = datePicker.val()
        console.log({
            name, amt, date, selectedExpenseTypeId
        });
        if (name === '' || amt === '' || selectedExpenseTypeId === undefined) {
            console.log("Invalid Data");
            return
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
        await updateExpense()
        await populateFoodDeliveryTable()

        $('all-expense-table').DataTable();
    })

    await populateCategories()

    await updateExpense();

    await populateFoodDeliveryTable()
    const table = $('#all-expense-table').DataTable({
        columnDefs: [
            { orderable: false, targets: 0 }
        ],
        "order": [],
        "pageLength": 100
        // stateSave: true
    });
    table.order.neutral().draw();



};
