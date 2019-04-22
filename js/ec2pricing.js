function selectEC2BySAPS(saps, OS, database, byol_ec2arr, sles_ec2arr, win_ec2arr, winsqlstd_ec2arr) {
    var BreakException = {};
    var currentEC2, previousEC2;
    var ec2sapsarr;
    if (OS=='Windows Server') {
        if (database=='BYOL')
            ec2sapsarr = win_ec2arr.sort(dynamicSort('saps'));
        else
            ec2sapsarr = winsqlstd_ec2arr.sort(dynamicSort('saps'));
    } else if (OS=='SUSE Enterprise Linux') {
        ec2sapsarr = sles_ec2arr.sort(dynamicSort('saps'));
    } else {
        ec2sapsarr = byol_ec2arr.sort(dynamicSort('saps'));
    }
    try {
        ec2sapsarr.forEach(function (item) {
            if (typeof currentEC2!='undefined')
                previousEC2 = currentEC2;
            currentEC2 = item;
            if (saps <= item.saps) {
                throw BreakException;
            }
        });
    } catch (e) {
        if (e !== BreakException) throw e;
    }
    if (typeof previousEC2!='undefined') {
        if (Math.abs(saps-currentEC2.saps) <= Math.abs(saps-previousEC2.saps)) {
            return currentEC2;
        } else {
            return previousEC2;
        }
    } else
        return currentEC2;
}

function selectEC2ByCPUAndRAM(cpu, ram, OS, database, byol_ec2arr, sles_ec2arr, win_ec2arr, winsqlstd_ec2arr) {
    var BreakException = {};
    var currentEC2, previousEC2;
    var ec2sapsarr;
    if (OS=='Windows Server') {
        if (database=='BYOL')
            ec2sapsarr = win_ec2arr.sort(dynamicSort('ram'));
        else
            ec2sapsarr = winsqlstd_ec2arr.sort(dynamicSort('ram'));
    } else if (OS=='SUSE Enterprise Linux') {
        ec2sapsarr = sles_ec2arr.sort(dynamicSort('ram'));
    } else {
        ec2sapsarr = byol_ec2arr.sort(dynamicSort('ram'));
    }
    try {
        ec2sapsarr.forEach(function (item) {
            if (typeof currentEC2!='undefined')
                previousEC2 = currentEC2;
            currentEC2 = item;
            if (ram <= item.ram) {
                throw BreakException;
            }
        });
    } catch (e) {
        if (e !== BreakException) throw e;
    }
    // currentEC2's RAM is enough for the requirement
    // previousEC2's RAM is not enough for the requirement
    // check if which has more CPU
    if (typeof previousEC2!='undefined') {
        if (currentEC2.vcpu < previousEC2.vcpu) {
            // will probably choose previous EC2 instance
            if (previousEC2.ram * 0.8 > ram) // check if RAM is 80% or higher
                return previousEC2; // RAM is okay
            else
                return currentEC2; // RAM is not enough, choosing the higher instance
        } else
            return currentEC2;
    } else
        return currentEC2;
}

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function findByEC2(ec2, OS, database, byol_ec2arr, sles_ec2arr, win_ec2arr, winsqlstd_ec2arr) {
    var BreakException = {};
    var foundEC2;
    var ec2sapsarr;
    if (OS=='Windows Server') {
        if (database=='BYOL')
            ec2sapsarr = win_ec2arr.sort(dynamicSort('saps'));
        else
            ec2sapsarr = winsqlstd_ec2arr.sort(dynamicSort('saps'));
    } else if (OS=='SUSE Enterprise Linux') {
        ec2sapsarr = sles_ec2arr.sort(dynamicSort('saps'));
    } else {
        ec2sapsarr = byol_ec2arr.sort(dynamicSort('saps'));
    }
    try {
        ec2sapsarr.forEach(function(item){
            foundEC2 = item;
            if (ec2 == item.ec2)
                throw BreakException;
        });
    } catch (e) {
        if (e !== BreakException) throw e;
    }
    return foundEC2;
}

function formatCurrency(value, prefix='') {
    var numberFormat = value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    if (prefix=='')
        return '$' + numberFormat;
    else
        return '$' + numberFormat + '/' + prefix;
}
